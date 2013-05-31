"use strict";
(function (aw, $) {
  function constructor(fileSource) {
    this.dialog = null;
    this.fileList = null;
    this.selectedFiles = [];

    this.fileSource = fileSource;
    this.onFilesSelected = new aw.Event();
  }

  function btnAdd_click(ev, ui) {
    this.onFilesSelected.trigger(this.selectedFiles);
    this.dialog.dialog('close');
  }

  function btnCancel_click(ev, ui) {
    this.dialog.dialog('close');
  }

  function fileListItem_click(ev) {
    var listItem = $(ev.currentTarget);
    var file = listItem.data('file');

    var index = this.selectedFiles.indexOf(file);
    var isSelecting = (index == -1);
    if (isSelecting) {
      this.selectedFiles.push(file);
    } else {
      this.selectedFiles.splice(index, 1);
    }

    listItem.toggleClass('aw-selected', isSelecting);
  }

  function addFiles(files) {
    this.fileList.removeClass('aw-loading');

    for (var i = 0; i < files.length; i++) {
      var fileItem = $('<li class="aw-remote-file-list-item"></li>').text(files[i].name);
      fileItem.data('file', files[i]);
      this.fileList.append(fileItem);
    }
  }

  function show() {
    if (this.dialog == null) {
      this.dialog = $('#remoteFileSelector').clone();
      this.fileList = this.dialog.find('.remote-file-list');
      this.fileList.on('click', '.aw-remote-file-list-item', fileListItem_click.bind(this));

      this.dialog.dialog({
        autoOpen: false,
        closeOnEscape: true,
        draggable: false,
        modal: true,
        resizable: false,
        title: 'Add Files From Google Drive',
        width: 900,
        buttons: {
          Add: btnAdd_click.bind(this),
          Cancel: btnCancel_click.bind(this)
        }
      });
    }

    this.fileList.addClass('aw-loading');
    this.fileList.empty();
    this.selectedFiles = [];
    this.fileSource.getList('audio/mpeg', addFiles.bind(this));
    this.dialog.dialog('open');
  }

  constructor.prototype = {
    show: show
  };

  aw.musicPlayer.ui.RemoteFileSelector = constructor;
})(window.aerieWorks, window.jQuery);
