'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer', [
   'aerieWorks.Event'
  ], function (aw) {
  // Constructor
  function player() {
    var audioNode = $('<audio />').css('display', 'none');
    $('body').append(audioNode);

    this.audio = audioNode[0];

    this.onPlaybackStarted = aw.Event.create();
    this.onPlaybackStopped = aw.Event.create();
    this.onPlaybackPaused = aw.Event.create();

    audioNode.bind('play', playbackStarted.bind(this));
    audioNode.bind('pause', playbackPaused.bind(this));
    audioNode.bind('ended', playbackStopped.bind(this));
  }

  // DOM event handlers
  function playbackStarted(ev) {
    this.debug('Received DOM "play" event.');
    this.onPlaybackStarted.trigger();
  }

  function playbackStopped(ev) {
    this.debug('Received DOM "ended" event.');
    // DOM events don't seem to fire if we replay after the track finishes.
    // Reassigning the audio source seems to fix this glitch.
    this.audio.src = this.audio.src;
    this.onPlaybackStopped.trigger();
  }

  function playbackPaused(ev) {
    this.debug('Received DOM "paused" event.');
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
    this.debug('Calling DOM::audio.pause().');
    this.audio.pause();
  }

  function play() {
    if (this.isStopped()) {
      this.setCurrentPosition(0);
    }
    this.debug('Calling DOM::audio.play().');
    this.audio.play();
  }

  function setCurrentPosition(positionInSeconds) {
    this.audio.currentTime = positionInSeconds;
  }

  function setFile(audioFile) {
    var wasPlaying = this.isPlaying();

    this.audio.src = audioFile.url;
    this.debug('set to "' + audioFile.getDisplayName() + '"');

    if (wasPlaying) {
      this.play();
    }
  }

  function stop() {
    this.debug('Stop called.');
    this.audio.pause();
    this.setCurrentPosition(0);
    this.audio.src = null;
  }

  aw.Type.create({
    name: 'Player',
    namespace: aw.musicPlayer,
    initializer: player,
    members: {
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
    }
  });
});
