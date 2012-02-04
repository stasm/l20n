var _paths = {
  'system': '/l20n/js/data/sys.j20n',
  'globals': '/l20n/js/data/default.j20n'
};

function Resource(aURI) {
  this.uri = aURI;
}

Resource.prototype = {
  _loading: true,
  uri: null,
}

var Context = {
  mFrozen: false,
  mResources: [],
  mEvents: {'ready': []},

  mObjects: {
    'resources': {},
    'context': {},
    'system': {},
    'globals': {},
  },

  initObjects: function(paths) {
    for (var name in _paths)
      this._getObject(this.mObjects[name], _paths[name]);
  },

  addResource: function(aURI) {
    var res = this._getObject(this.mObjects['resources'], aURI);
  },
  get: function(id, args) {
    var curObj = this._get(id, args);
    return this.mObjects['system'].getent(curObj, this.mObjects['system'], id);
  },
  getAttributes: function(id, args) {
    var curObj = this._get(id, args);
    return this.mObjects['system'].getattrs(curObj, this.mObjects['system'], id);
  },
  isFrozen: function() {
    return this.mFrozen; 
  },
  freeze: function() {
    this.mFrozen = true;
    if (this.isReady()) {
      this._fireCallback();
    }
  },
  isReady: function() {
    if (!this.mFrozen)
      return false;
    for (var i = 0; i < this.mResources.length; i++) {
      if (this.mResources[i]._loading)
        return false;
    }
    return true;
  },
  set onReady(callback) {
    if (!this.isReady())
      this.mEvents['ready'].push(callback);
    else
      callback();
  },
  set data(data) {
    this.mObjects['context'] = data
  },
  get data() {
    return this.mObjects['context'];
  },

  // Private
  _get: function(id, args) {
    var curObj = this.mObjects['resources'];
    if (this.mObjects['context']) {
      this.mObjects['context'].__proto__ = curObj;
      curObj = this.mObjects['context'];
    }
    if (args) {
      args.__proto__ = curObj;
      curObj = args;
    }
    this.mObjects['globals'].__proto__ = curObj;
    return this.mObjects['globals'];
  },
  _getObject: function(frame, url) {
    var res = new Resource(url);
    this._loadObject(res, frame);
    this.mResources.push(res);
  },
  _loadObject: function(res, frame) {
    var self = this;
    var xhr = new XMLHttpRequest();
    //xhr.overrideMimeType('text/plain');
    xhr.addEventListener("load", function() {
      self._injectResource(frame, res, xhr.responseText)
    });
    xhr.open('GET', res.uri, true);
    xhr.send('');
  },
  _injectResource: function(frame, res, data) {
    this._readObject(data, frame);
    res._loading = false;

    if (this.isReady()) {
      this._fireCallback();
    }
  },
  _readObject: function(data, frame) {
    new Function(data).call(frame);
  },
  _fireCallback: function() {
    if (this.mEvents['ready'].length) {
      for (var i in this.mEvents['ready'])
        this.mEvents['ready'][i]();
      this.mEvents['ready'] = [];
    }
  }
}

var Controller = {
  get: function(id) {
    Context.onReady = function() {
      var value = Context.get(id);
      postMessage({id: id, value: value});
    };
  },

  addResource: function(uri) {
    Context.addResource(uri);
  },

  freeze: function() {
    Context.freeze();
  },
}


Context.initObjects(_paths);
onmessage = function(event) {
  Controller[event.data.cmd](event.data.data);
}
