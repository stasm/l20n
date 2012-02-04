var L20n = {
  getContext: function() {
    return new this.Context();
  }
}

L20n.Resource = function(aURI) {
  this.uri = aURI;
}

L20n.Resource.prototype = {
  _loading: true,
  uri: null,
}

L20n.Context = function() {
  var self = this;
  this.callbacks = {};
  this.worker = new Worker('/l20n/js/l20n.worker.js');
  this.worker.onmessage = function(event) {
    self.callbacks[event.data.id](event.data.value);
  }
}

L20n.Context.prototype = {
  postMessage: function(cmd, data) {
    this.worker.postMessage({
      cmd: cmd,
      data: data,
    });
  },
  get: function(id, callback) {
    this.postMessage('get', id);
    this.callbacks[id] = callback;
  },
  getAttributes: function(id, args) {
  },
  freeze: function() {
  },
}
