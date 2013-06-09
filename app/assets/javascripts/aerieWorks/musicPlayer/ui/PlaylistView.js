'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer.ui', [
   'aerieWorks.io.LocalFile',
   'aerieWorks.musicPlayer.file.AudioFileFactory',
   'aerieWorks.musicPlayer.ui.RemoteFileSelector'
  ], function (aw, $) {
  var CSS_selectedPlaylistItem = 'selectedPlaylistItem';

  // Constructor
  function PlaylistView(
      playlist,
      playlistNode,
      btnAddRemoteFiles,
      fileSelector,
      btnRemoveAll,
      remoteFileSource) {
    this.playlist = playlist;
    this.playlistNode = playlistNode;
    this.fileSelector = fileSelector;
    this.remoteFileSource = remoteFileSource;
    this.remoteFileSelector = null;

    btnAddRemoteFiles.click(btnAddRemoteFilesClicked.bind(this));
    btnRemoveAll.click(btnRemoveAllClicked.bind(this));
    fileSelector.change(fileSelectorChanged.bind(this));
    playlistNode.bind('dragenter', playlistDragEnter.bind(this));
    playlistNode.bind('dragover', playlistDragOver.bind(this));
    playlistNode.bind('drop', playlistDrop.bind(this));

    this.playlist.onCleared.addHandler(onPlaylistCleared.bind(this));
    this.playlist.onItemAdded.addHandler(onPlaylistItemAdded.bind(this));
    this.playlist.onItemSelected.addHandler(
      onPlaylistItemSelected.bind(this));
  }

  // DOM event handlers
  function btnAddRemoteFilesClicked(ev) {
    if (this.remoteFileSelector == null) {
      this.remoteFileSelector = aw.musicPlayer.ui.RemoteFileSelector.create(this.remoteFileSource);
      this.remoteFileSelector.onFilesSelected.addHandler(addRemoteFiles.bind(this));
    }

    this.remoteFileSelector.show();
  }

  function btnRemoveAllClicked(ev) {
    this.playlist.clear();
  }

  function fileSelectorChanged(ev) {
    if (ev.target.files != null) {
      var files = [];
      for (var i = 0; i < ev.target.files.length; i++) {
        files.push(aw.io.LocalFile.create(ev.target.files[i]));
      }

      addFiles(this, files);
    }
  }

  function playlistDragEnter(ev) {
    ev.stopPropagation();
    ev.preventDefault();
  }

  function playlistDragOver(ev) {
    ev.stopPropagation();
    ev.preventDefault();
  }

  function playlistDrop(ev) {
    ev.stopPropagation();
    ev.preventDefault();
    addFiles(this, ev.originalEvent.dataTransfer.files);
  }

  function playlistItemClicked(ev) {
    var view = ev.data.view;
    var item = ev.data.item;
    view.playlist.selectItemById(item.id);
  }

  // Playlist event handlers
  function onPlaylistCleared() {
    this.playlistNode.empty();
  }

  function onPlaylistItemAdded(item) {
    this.debug('Invoked.');
    var itemWrapper = $('<li class="playlistItem" />');
    var itemHandle = $('<span class="playlistItemHandle"></span>');
    var itemLabel = $('<span></span>');
    itemLabel.text(item.file.getDisplayName());

    itemWrapper.append(itemHandle);
    itemWrapper.append(itemLabel);
    itemWrapper.attr('id', getElementIDForItem(this, item));
    itemWrapper.bind('click', { view: this, item: item },
      playlistItemClicked);
    this.playlistNode.append(itemWrapper);

    item.file.onFileChanged.addHandler(function (file) {
      itemLabel.text(file.getDisplayName());
    });
  }

  function onPlaylistItemSelected(item) {
    this.debug('Invoked.');
    var selectedNode = $('#' + getElementIDForItem(this, item));
    selectedNode.siblings().removeClass(CSS_selectedPlaylistItem);
    selectedNode.addClass(CSS_selectedPlaylistItem);
  }

  // Private methods
  function addRemoteFiles(files) {
    addFiles(this, files);
  }

  function addFiles(view, files) {
    for (var i = 0; i < files.length; i++) {
      if (/^audio\//.test(files[i].type)) {
        view.playlist.addItem(aw.musicPlayer.file.AudioFileFactory.createFile(files[i]));
      }
    }
  }

  function getElementIDForItem(view, item) {
    return 'playlistItem_' + item.id;
  }

  aw.Type.create({
    name: 'PlaylistView',
    namespace: aw.musicPlayer.ui,
    initializer: PlaylistView
  });
});
