'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer.ui', function (aw) {
  // Constructor
  function PlayerView(
      player,
      playlist,
      positionTrackerNode,
      timeDisplay,
      currentFileDisplay,
      btnPrevious,
      btnNext,
      btnPlayPause) {
    this.player = player;
    this.playlist = playlist;
    this.positionTracker = positionTrackerNode.slider({
      min: 0,
      max: 100,
      value: 0,
      step: 0.1,
      change: positionTrackerChanged.bind(this),
      start: positionTrackerStarted.bind(this),
      stop: positionTrackerStopped.bind(this)
    });
    this.updatePositionTracker = true;

    this.timeDisplay = timeDisplay;
    this.currentFileDisplay = currentFileDisplay;

    this.btnPlayPause = btnPlayPause;
    this.btnNext = btnNext;
    this.btnPrevious = btnPrevious;

    this.updateIntervalID = null;

    timeDisplay.text('00:00');
    btnPlayPause
      .attr('disabled', true)
      .click(btnPlayPauseClicked.bind(this));
    btnNext
      .attr('disabled', true)
      .click(btnNextClicked.bind(this));
    btnPrevious
      .attr('disabled', true)
      .click(btnPreviousClicked.bind(this));

    this.player.onPlaybackPaused.addHandler(
      onPlayerPlaybackPaused.bind(this));
    this.player.onPlaybackStarted.addHandler(
      onPlayerPlaybackStarted.bind(this));
    this.player.onPlaybackStopped.addHandler(
      onPlayerPlaybackStopped.bind(this));

    this.playlist.onCleared.addHandler(onPlaylistCleared.bind(this));
    this.playlist.onItemAdded.addHandler(onPlaylistItemAdded.bind(this));
    this.playlist.onItemSelected.addHandler(
      onPlaylistItemSelected.bind(this));
  }

  // DOM Event handlers
  function btnPreviousClicked(ev) {
    gotoStartOrPrevious(this);
  }

  function btnNextClicked(ev) {
    gotoNext(this);
  }

  function btnPlayPauseClicked(ev) {
    togglePlayback(this);
  }

  function positionTrackerChanged(ev, ui) {
    var positionInSeconds;
    if (ev.originalEvent !== undefined) {
      positionInSeconds = this.player.getDuration() * (ui.value / 100);
      this.player.setCurrentPosition(positionInSeconds);
    }
  }

  function positionTrackerStarted(ev, ui) {
    this.updatePositionTracker = false;
  }

  function positionTrackerStopped(ev, ui) {
    this.updatePositionTracker = true;
  }

  // Player event handlers
  function onPlayerPlaybackPaused() {
    updateWhenPlaybackStatusChanged(this);
  }

  function onPlayerPlaybackStarted() {
    updateWhenPlaybackStatusChanged(this);
  }

  function onPlayerPlaybackStopped() {
    if (this.playlist.isLastItemSelected()) {
      updateWhenPlaybackStatusChanged(this);
    } else {
      gotoNext(this);
      this.player.play();
    }
  }

  function onPlaylistCleared() {
    this.player.stop();
    this.currentFileDisplay.text('');
  }

  function onPlaylistItemAdded(item) {
    this.btnPlayPause.attr('disabled', false);
    updateNextButtonState(this);
  }

  function onPlaylistItemSelected(item) {
    setPlayingFile(this, item.file);
  }

  // Private methods
  function gotoNext(view) {
    view.playlist.selectNext();
  }

  function gotoStartOrPrevious(view) {
    if (view.playlist.isFirstItemSelected() ||
      view.player.getCurrentPosition() > 2) {
      view.player.setCurrentPosition(0);
    } else {
      view.playlist.selectPrevious();
    }
  }

  function setPlayingFile(view, file) {
    view.player.setFile(file);
    view.player.play();
    view.btnPrevious.attr('disabled', false);
    view.btnNext.attr('disabled', view.playlist.isLastItemSelected());
    view.currentFileDisplay.text(file.getDisplayName());
  }

  function startUpdating(view) {
    if (view.updateIntervalID == null) {
      view.updateIntervalID = setInterval(
        updateView.bind(null, view), 10);
    }
  }

  function togglePlayback(view) {
    if (view.player.isStopped() || view.player.isPaused()) {
      view.player.play();
    } else {
      view.player.pause();
    }
  }

  function updateNextButtonState(view) {
    view.btnNext.attr('disabled', view.playlist.isLastItemSelected());
  }

  function updateWhenPlaybackStatusChanged(view) {
    var playPauseText = 'Play';
    if (view.player.isPlaying()) {
      playPauseText = 'Pause';
      startUpdating(view);
    }
    view.btnPlayPause.text(playPauseText);
  }

  function updateView(view) {
    var duration = view.player.getDuration();
    var currentTime = view.player.getCurrentPosition();
    var minutes = Math.floor(currentTime / 60);
    var seconds = Math.floor(currentTime % 60);

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    if (seconds < 10) {
      seconds = '0' + seconds;
    }

    view.timeDisplay.text(minutes + ':' + seconds);

    if (view.updatePositionTracker) {
      view.positionTracker.slider("value", currentTime / duration * 100);
    }

    if (!view.player.isPlaying()) {
      clearInterval(view.updateIntervalID);
      view.updateIntervalID = null;
    }
  }

  aw.Type.create({
    name: 'PlayerView',
    namespace: aw.musicPlayer.ui,
    initializer: PlayerView
  });
});
