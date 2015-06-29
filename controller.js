//debag
var count = -1;

/*
WebRTC 
*/
var peer = new Peer({
    key: 'gj6od1nfegtoi529',
    debug: 3,
    config: {
        'iceServers': [
            {url: 'stun:stun.l.google.com:19302'}
        ]
    }
});

var conn; //相手ID用
var peerId;
var myPeerID;

peer.on('connection', connect);



/*
受信処理
*/

function connect(c){
    //メッセージ受信
    c.on('data', function(data) {
        count++;
        console.log('Received', data);
        console.log('count: ', count);

        startAudio(data);
    });
    //エラー時
    c.on('error', function(err){alert(err);});
}

angular.module('myApp', [])
    .controller('peerController', ['$scope', function($scope) {

        peer.on('open', function(id) {
            console.log('My Peer ID is: ' + id);
            myPeerID = id;
            $scope.myId = id;
            $scope.$apply();
        });

        $scope.connect = function(){
            peerId = $scope.peer;
            console.log(peerId);
            conn = peer.connect(peerId, {reliable: true});
            conn.on('open', function(){
                //conn.send(myPeerID);
            });
            $scope.status = 'connected!';
        }

        $scope.send = function(){
            //var buf = new Unit8Array(source);
            // conn.send(source);
            chunkSend(source);

        }

        $scope.addNewFiles = function(newFiles) {
            var length = newFiles.length;
            for (var i = 0; i < length; i++) {
                var file = newFiles[i];
                var reader = new FileReader();

                reader.onloadend = (function(theFile) {
                    return function(e) {
                        console.log(theFile);
                        console.log(reader.result);
                        source = reader.result;
                    };
                    console.log(reader.result);
                }(file));
                reader.readAsArrayBuffer(file);
            }
        };
    }])
    .directive('fileDropZone', function() {
        return {
            restrict: 'A',
            scope: {
                onDropFiles: '&' // Callback
            },
            link: function(scope, element, attrs) {
 
                // Event handler for two events: 'dragenter' & 'dragover'.
                var processDragOverOrEnter = function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                };
 
                // Event handler for the 'drop' event.
                var processDrop = function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    scope.onDropFiles({files: event.dataTransfer.files});
                };
 
                element.bind('dragover', processDragOverOrEnter);
                element.bind('dragenter', processDragOverOrEnter);
                element.bind('drop', processDrop);
            }
        }
    });


function chunkSend(data){
    console.log('chunk start');
    //var u8a = new Uint8Array(data);
    //var f32a = new Float32Array(data);


    var blob = new Blob([data]);
    var num =0;

    const BYTES_PER_CHUNK = 512 * 1024; //KB
    console.log('size: ', blob.size);
    const SIZE = blob.size;

    var start = 0;
    var end = BYTES_PER_CHUNK;

    conn.send(SIZE);

    console.log('end: ', end);


    while(start < SIZE){
        //num++;
        //var chunk = blob.slice(start, end);
        var chunk = blob.slice(start, end);

        //console.log(chunk.size);

        console.log('chunk');
        conn.send(chunk);    

        start = end;
        end = start + BYTES_PER_CHUNK;

    }

    console.log('while end');
}

/*
Web Audio API
*/
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

context.createGain = context.createGain || context.createGainNode;
var gainNode = context.createGain();

var timerid = null;

var buffer;
var source;

var scheduled_time = 0;
var initial_delay_sec = 1;

var startAudio = function(arrayBuffer){ 
    var errorCallback = function() {
            console.log('Error : "decodeAudioData" method !!');
         };

    var successCallback = function(audioBuffer) {

            if ((source instanceof AudioBufferSourceNode) && (source.buffer instanceof AudioBuffer)) {

                     if (timerid !== null) {
                         window.clearTimeout(timerid);
                        timerid = null;
                    }
                }

                source = context.createBufferSource();

                source.buffer = audioBuffer;

                source.start = source.start || source.noteGrainOn;

                var current_time = context.currentTime;

                source.connect(gainNode);
                source.connect(context.destination);


                source.loop               = false;
                source.loopStart          = 0;
                source.loopEnd            = audioBuffer.duration;
                source.playbackRate.value = 1.0;


                
                if(current_time < scheduled_time){
                    source.start(scheduled_time);
                    scheduled_time += audioBuffer.duration;              
                }else{
                    source.start(scheduled_time);
                    scheduled_time = current_time + audioBuffer.duration + initial_delay_sec;
                }      
    };

    context.decodeAudioData(arrayBuffer, successCallback, errorCallback);
        
};

