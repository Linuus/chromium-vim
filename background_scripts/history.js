var History = {

  historyTypes: ['action', 'url', 'search'],
  searchResults: null,
  historyStore: [],
  commandHistory: {},
  shouldRefresh: false,

  saveCommandHistory: function() {
    Object.keys(this.commandHistory).forEach(function(e) {
      localStorage[e] = JSON.stringify(this.commandHistory[e]);
    }.bind(this));
  },

  append: function(value, type) {
    if (~this.historyTypes.indexOf(type)) {
      this.commandHistory[type].push('' + value);
      this.commandHistory[type] =
        this.commandHistory[type].splice(-500);
      this.saveCommandHistory();
    }
  },

  retrieve: function(type) {
    return [type, this.commandHistory[type]];
  },

  refreshStore: (function() {
    var utime;
    var calculateWeight = function(item) {
      var weight = 1;
      var points = 0;
      var delta = utime - item.lastVisitTime;
      switch (true) {
      case delta < 345600000:  // 0-4 days
        break;
      case delta < 1209600000: // 5-14 days
        weight = 0.7; break;
      case delta < 2678400000: // 15-31 days
        weight = 0.5; break;
      case delta < 7776000000: // 32-90 days
        weight = 0.3; break;
      default: weight = 0.1;
      }
      points += item.visitCount * 100 * weight;
      points += item.typedCount * 200 * weight;
      return points;
    };
    return function() {
      utime = new Date().getTime();
      this.shouldRefresh = false;
      M=[];
      chrome.history.search({
        text: '',
        startTime: 0,
        maxResults: 2147483647,
      }, function(results) {
        History.historyStore = results.sort(function(a, b) {
          return calculateWeight(b) - calculateWeight(a);
        });
        History.historyStore.forEach(function(e){M.push([e, calculateWeight(e)]);});
      });
    };
  })(),

  retrieveSearchHistory: function(search, limit, callback) {
    if (History.shouldRefresh) {
      History.refreshStore();
    }
    callback(searchArray(this.historyStore, search, limit, true, function(item) {
      return item.title + item.url;
    }, true));
  }

};

(function() {
  History.historyTypes.forEach(function(type) {
    var data = localStorage[type];
    try {
      data = JSON.parse(data);
    } catch (e) {
      data = typeof data === 'string' ? data.split(',') : [];
    }
    History.commandHistory[type] = data;
  });
})();

History.refreshStore();
