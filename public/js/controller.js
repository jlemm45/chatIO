var chat = angular.module('chat', ['ngAnimate','luegg.directives', 'ngCookies', 'ngFileUpload']);

chat.controller('controller', function($scope,$window,$cookies,Upload) {

    //Handle resize for layout changes
    var w = angular.element($window);
    w.bind('resize', function () {
        $scope.windowSize = screen.width;
        $scope.isMobile = screen.width < 640;
        $scope.$apply();
    });

    function playAudio() {
        if (focused === false) {
            var audio = new Audio('../sounds/Sparkle Pop Bonus.wav');
            audio.play();
        }
    }

    var socket;

    //Current window size
    $scope.windowSize = screen.width;

    //Are we on mobile sizing?
    $scope.isMobile = screen.width < 640;

    $scope.activeIcon = 'rocket';
    $scope.chatStarted = false;
    $scope.currentUser = false;
    $scope.messageToSend = '';
    $scope.nameError = false;
    $scope.yourName = '';
    $scope.connectedUsers = [];
    $scope.activeChatWindow = 'Main Lobby';
    $scope.pm = false;
    $scope.toggleMobile = false;

    $scope.messages = {
        'Main Lobby': []
    };

    $scope.toggleMobileNav = function() {
        $scope.toggleMobile = $scope.toggleMobile ? false : true;
    };

    $scope.setActiveIcon = function(icon) {
        $scope.activeIcon = icon;
    };

    $scope.startChat = function(name,data) {
        socket = io();

        socket.on('activeUsers', function(msg) {
            $scope.connectedUsers = msg;
            $scope.$apply();
        });

        socket.on('userJoined', function(msg) {
            if($scope.currentUser) {
                $scope.messages['Main Lobby'].push({
                    name: 'User Joined',
                    text: msg
                });
            }
        });

        socket.on('chats', function(msg) {
            $scope.messages['Main Lobby'] = msg;
            $scope.$apply();
        });

        socket.on('userLeft', function(msg) {
            if($scope.currentUser) {
                $scope.messages['Main Lobby'].push({
                    name: 'User Left',
                    text: msg
                });
            }
        });

        socket.on('chat message', function(msg){
            $scope.messages['Main Lobby'].push({
                name: msg.name,
                text: msg.text
            });
            $scope.$apply();

            playAudio();
        });

        socket.on('private message', function(msg){
            if(!$scope.messages[msg.name]) {
                $scope.messages[msg.name] = [];
            }
            $scope.messages[msg.name].push({
                name: msg.name,
                text: msg.text
            });

            if($scope.activeChatWindow !== msg.name) {
                for(var i = 0; i < $scope.connectedUsers.length; i++) {
                    if($scope.connectedUsers[i].name == msg.name) {
                        $scope.connectedUsers[i].unRead++;
                    }
                }
            }
            $scope.$apply();

            playAudio();
        });

        $scope.yourName = name;
        if($scope.yourName.length > 0) {
            $scope.currentUser = name;
            $scope.chatStarted = true;
            if(!data) {
                data = {
                    name: name,
                    icon: $scope.activeIcon,
                    unRead: 0
                }
            }
            socket.emit('New User', data);
            $cookies.putObject('chatIO', data);
        }
        else {
            $scope.nameError = true;
        }
    };

    $scope.leaveChat = function() {
        socket.emit('kill');
        $scope.chatStarted = false;
        $cookies.remove('chatIO');
    };

    $scope.sendMessage = function() {
        var queue = $scope.activeChatWindow;
        var message = $scope.messageToSend;
        var cUser = $scope.currentUser;
        if(message.length <= 0) return;
        if(queue == 'Main Lobby') {
            socket.emit('chat message', {
                name: cUser,
                text: message
            });
        }
        else {
            socket.emit('private message', {
                name: cUser,
                text: message,
                receive: queue
            });
            if(!$scope.messages[queue]) {
                $scope.messages[queue] = [];
            }
            $scope.messages[queue].push({
                name: cUser,
                text: message
            });
        }
        $scope.messageToSend = '';
    };

    $scope.chatWindow = function(chat,type) {
        $scope.pm = type;
        $scope.activeChatWindow = chat;
        if(type) {
            for(var i = 0; i < $scope.connectedUsers.length; i++) {
                if($scope.connectedUsers[i].name == chat) {
                    $scope.connectedUsers[i].unRead = 0;
                }
            }
        }
        $scope.toggleMobileNav();
    };

    // upload on file select or drop
    $scope.uploadFile = function (file) {
        var policy = '{"expiration": "2020-01-01T00:00:00Z","conditions": [{"bucket": "angular-file-upload"}["starts-with", "$key", ""],{"acl": "private"},["starts-with", "$Content-Type", ""],["starts-with", "$filename", ""],["content-length-range", 0, 524288000]]}';
        console.log(file.name);
        Upload.upload({
            url: 'https://chatio.s3-us-west-2.amazonaws.com',
            method: 'POST',
            data: {
                key: file.name, // the key to store the file on S3, could be file name or customized
                AWSAccessKeyId: 'AKIAJXKJK62WS5WUQL7A',
                acl: 'public-read', // sets the access to the uploaded file in the bucket: private, public-read, ...
                policy: btoa(policy), // base64-encoded json policy (see article below)
                signature: 'wVuk7P8GU5rBPxFq9ghhKRqZ6Qw=', // base64-encoded signature based on policy string (see article below)
                "Content-Type": file.type != '' ? file.type : 'application/octet-stream', // content type of the file (NotEmpty)
                //filename: file.name, // this is needed for Flash polyfill IE8-9
                file: file
            }
        }).then(function (resp) {
            console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    if($cookies.getObject('chatIO')) {
        var data = $cookies.getObject('chatIO');
        $scope.startChat(data.name,data);
    }

}).directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'event': event});
                });
                event.preventDefault();
            }
        });
    };
}).directive('animateOnChange', function($timeout) {
    return function(scope, element, attr) {
        scope.$watch(attr.animateOnChange, function(nv,ov) {
            if (nv!=ov) {
                element.addClass('changed');
                $timeout(function() {
                    element.removeClass('changed');
                }, 1000);
            }
        });
    };
});

var focused = true;

window.onfocus = window.onblur = function(e) {
    focused = (e || event).type === "focus";
}