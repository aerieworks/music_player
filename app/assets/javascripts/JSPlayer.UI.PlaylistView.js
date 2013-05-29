(function() {
    "use strict";
    var CSS_selectedPlaylistItem = 'selectedPlaylistItem';

    // Constructor
    function PlaylistView(
            playlist,
            playlistNode,
            btnAddFiles,
            fileSelector,
            btnRemoveAll) {
        this.playlist = playlist;
        this.playlistNode = playlistNode;
        this.fileSelector = fileSelector;

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
    function btnRemoveAllClicked(ev) {
        this.playlist.clear();
    }

    function fileSelectorChanged(ev) {
        var files = ev.target.files;
        if (files != null) {
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
        view.playlist.selectItemByID(item.id);
    }

    // JSPlayer.event handlers
    function onPlaylistCleared() {
        this.playlistNode.empty();
    }

    function onPlaylistItemAdded(item) {
        JSPlayer.log('JSPlayer.UI.PlaylistView.onPlaylistItemAdded(): called.');
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
            itemButton.text(file.getDisplayName());
        });
    }

    function onPlaylistItemSelected(item) {
        JSPlayer.log('JSPlayer.UI.PlaylistView.onPlaylistItemSelected(): called.');
        var selectedNode = $('#' + getElementIDForItem(this, item));
        selectedNode.siblings().removeClass(CSS_selectedPlaylistItem);
        selectedNode.addClass(CSS_selectedPlaylistItem);
    }

    // Private methods
    function addFiles(view, files) {
        for (var i = 0; i < files.length; i++) {
            if (/^audio\//.test(files[i].type)) {
                view.playlist.addItem(JSPlayer.File.create(files[i]));
            }
        }
    }

    function getElementIDForItem(view, item) {
        return 'playlistItem_' + item.id;
    }

    JSPlayer.UI.PlaylistView = PlaylistView;
})();
