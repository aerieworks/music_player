(function() {
    "use strict";

    // Constructor
    function player() {
        var audioNode = $('<audio />').css('display', 'none');
        $('body').append(audioNode);

        this.audio = audioNode[0];

        this.onPlaybackStarted = new JSPlayer.event();
        this.onPlaybackStopped = new JSPlayer.event();
        this.onPlaybackPaused = new JSPlayer.event();

        audioNode.bind('play', playbackStarted.bind(this));
        audioNode.bind('pause', playbackPaused.bind(this));
        audioNode.bind('ended', playbackStopped.bind(this));
    }

    // DOM event handlers
    function playbackStarted(ev) {
        JSPlayer.log('JSPlayer.player.playbackStarted: Received DOM "play" event.');
        this.onPlaybackStarted.trigger();
    }

    function playbackStopped(ev) {
        JSPlayer.log('Received DOM "ended" event.');
        // DOM events don't seem to fire if we replay after the track finishes.
        // Reassigning the audio source seems to fix this glitch.
        this.audio.src = this.audio.src;
        this.onPlaybackStopped.trigger();
    }

    function playbackPaused(ev) {
        JSPlayer.log('Received DOM "paused" event.');
        this.onPlaybackPaused.trigger();
    }

    // Public methods
    function getCurrentPosition() {
        return this.audio.currentTime;
    }

    function getDuration() {
        return this.audio.duration;
    }

    function isPaused() {
        return this.audio.paused;
    }

    function isPlaying() {
        return !(this.isPaused() || this.isStopped());
    }

    function isStopped() {
        return this.audio.ended;
    }

    function pause() {
        JSPlayer.log('JSPlayer.player.pause: Calling DOM::audio.pause().');
        this.audio.pause();
    }

    function play() {
        if (this.isStopped()) {
            this.setCurrentPosition(0);
        }
        JSPlayer.log('JSPlayer.player.play: Calling DOM::audio.play().');
        this.audio.play();
    }

    function setCurrentPosition(positionInSeconds) {
        this.audio.currentTime = positionInSeconds;
    }

    function setFile(audioFile) {
        var wasPlaying = this.isPlaying();

        this.audio.src = audioFile.url;
        JSPlayer.log('JSPlayer.player.setFile: set to "' + audioFile.getDisplayName() + '"');
        
        if (wasPlaying) {
            this.play();
        }
    }

    function stop() {
        JSPlayer.log('JSPlayer.player.stop: called.');
        this.audio.pause();
        this.setCurrentPosition(0);
        this.audio.src = null;
    }

    player.prototype = {
        getCurrentPosition: getCurrentPosition,
        getDuration: getDuration,
        isPaused: isPaused,
        isPlaying: isPlaying,
        isStopped: isStopped,
        pause: pause,
        play: play,
        setCurrentPosition: setCurrentPosition,
        setFile: setFile,
        stop: stop
    };

    JSPlayer.player = player;
})();
