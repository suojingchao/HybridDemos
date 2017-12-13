var gLogType = "console";
function _log(msg) {
	if ("none" == gLogType) {
		return;
	} else if ("alert" == gLogType) {
		alert("[alert log] " + msg);
	} else if ("console" == gLogType) {
		try {
			console.log("[console log] " + msg);
		} catch(err) {
		}
	} else {
	}
}

var gSessionId = "";
var gCallbackId = 0;
var gCallbackMap = new Map();
var gEventMap = new Map();
var JSBridge = new JSBridgeImpl();

function setLogType(logType) {
	gLogType = logType;
}

function setSessionId(sessionId) {
	gSessionId = sessionId;
}

function JSBridgeImpl() {

	this.invoke = function(funcName, paramObj, callback) {
		try {
			if (!funcName || typeof funcName != "string" || funcName == "") {
				throw new Error("'funcName' must be a non empty string: " + funcName);
			}

			var paramStr = null;
			if (paramObj) {
				if (typeof paramStr == "object") {
					paramStr = JSON.stringify(paramObj);
					// _log("JSON.stringify(paramObj): " + paramStr);
				} else {
					throw new Error("unsupported param type for 'paramObj': " + paramObj);
				}
			}

			if (!callback) {
				_log("Warning: callback is undefined or null: " + callback);
			} else if (typeof callback != "function") {
				throw new Error("'callback' must be a function: " + callback);
			}

			var localCallbackId = ++gCallbackId;
			_log("put \n" + localCallbackId + ":" + callback + "\n to gCallbackMap");
			gCallbackMap.put(localCallbackId, callback);

			confirm(genInvokeInfoStr(localCallbackId, funcName, paramStr));
		} catch (err) {
			_log("invoke err: " + err.message);
			throw err;
		}

	}

	function genInvokeInfoStr(callbackId, funcName, paramStr) {
		var invokeInfoObj = {
			"sessionId" : gSessionId,
			"callbackId" : callbackId,
			"funcName" : funcName,
			"paramStr" : paramStr
		};
		var invokeInfoStr = "#js_invoke#" +  JSON.stringify(invokeInfoObj);
		return invokeInfoStr;
	}

}

function onInit(paramStr) {
    _log("onInit " + paramStr);
	try {
		if (paramStr && typeof paramStr == "string" && paramStr != "") {
			var res = JSON.parse(paramStr);
			if (res.logType) {
				setLogType(res.logType);
			}
			if (res.sessionId) {
				setSessionId(res.sessionId);
			}
		}
	} catch (err) {
		_log("onInit1 err: " + err.message);
	}

	try {
		if (window.JSBridge._hasInit) {
			_log('hasInit, no need to init again');
			return;
		}

		window.JSBridge._hasInit = true;
		_log('will dispatchEvent JSBridgeReady.');
        var readyEvent = document.createEvent('Events');
        readyEvent.initEvent('JSBridgeReady');
        document.dispatchEvent(readyEvent);
	} catch (err) {
		_log("onInit2 err: " + err.message);
	}
}

function onCallback(paramStr) {
	try {
		var res = JSON.parse(paramStr);
		if (res.sessionId && res.sessionId != gSessionId) {
			return;
		}

		var callbackId = res.callbackId;
		var callback = gCallbackMap.get(callbackId);
		_log("callback=" + callback + " callbackId=" + callbackId)
		if (callback != null) {
			gCallbackMap.remove(callbackId);
			callback(res);
		}
	} catch (err) {
		_log("onCallback err: " + err.message);
	}
}

function handleMessage(messageName, paramStr) {
	if (messageName == "init") {
		onInit(paramStr);
	} else if (messageName == "onCallback") {
		onCallback(paramStr);
	}
}

function Map() {
	this.map    =  new Object();
	this.length = 0;
    
	this.size = function() {
		return this.length;
	}  
    
	this.put = function(key, value){
		if( !this.map['_' + key]) {
			++this.length;
		}  
       
		this.map['_' + key] = value;
	}  
    
	this.remove = function(key){
		if(this.map['_' + key]) {
			--this.length;  
			return delete this.map['_' + key]; 
		} else {  
			return false;  
		}  
	}  
    
	this.containsKey = function(key){
		return this.map['_' + key] ? true : false;
	}
    
	this.get = function(key){     
		return this.map['_' + key] ? this.map['_' + key] : null;  
	}  
  
  
	this.toString = function() {
		var str = '';
    
		for(var each in this.map) {
			str += '\n' + each + '-' + this.map[each];
		}
    
		return str;
	}
}
