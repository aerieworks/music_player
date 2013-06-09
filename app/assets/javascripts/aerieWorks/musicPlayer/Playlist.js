'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer', [
   'aerieWorks.Event'
  ], function (aw) {
  var nextItemID = 0;

  // Constructor
  function playlist() {
    this.items = [];
    this.selectedIndex = null;

    this.onCleared = aw.Event.create();
    this.onItemAdded = aw.Event.create();
    this.onItemSelected = aw.Event.create();
  }

  // Private methods
  function createItem(playlist, file) {
    var item = { id: nextItemID, file: file };
    nextItemID += 1;
    return item;
  }

  // Public methods
  function addItem(file) {
    var item = createItem(playlist, file);
    this.items.push(item);

    this.onItemAdded.trigger(item);

    if (this.selectedIndex == null) {
      this.selectItem(0);
    }
  }

  function clear() {
    this.items = [];
    this.selectedIndex = null;
    this.onCleared.trigger();
  }

  function isFirstItemSelected() {
    return this.selectedIndex != null && this.selectedIndex == 0;
  }

  function isLastItemSelected() {
    return this.selectedIndex != null &&
      this.selectedIndex == this.items.length - 1;
  }

  function selectItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.selectedIndex = index;
      this.onItemSelected.trigger(this.items[index]);
    }
  }

  function selectItemByID(itemID) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].id == itemID) {
        this.selectItem(i);
        break;
      }
    }
  }

  function selectNext() {
    if (this.selectedIndex < this.items.length - 1) {
      this.selectItem(this.selectedIndex + 1);
    }
  }

  function selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectItem(this.selectedIndex - 1);
    }
  }

  aw.Type.create({
    name: 'Playlist',
    namespace: aw.musicPlayer,
    initializer: playlist,
    members: {
      addItem: addItem,
      clear: clear,
      isFirstItemSelected: isFirstItemSelected,
      isLastItemSelected: isLastItemSelected,
      selectItem: selectItem,
      selectItemById: selectItemByID,
      selectNext: selectNext,
      selectPrevious: selectPrevious
    }
  });
});
