/*global
YAHOO
*/
(function() {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;
    var Logging = Toronto.core.logging;
    var L = YAHOO.lang;

    /* is this stuff defined? */
    if (!document.ELEMENT_NODE) {
        document.ELEMENT_NODE = 1;
        document.ATTRIBUTE_NODE = 2;
        document.TEXT_NODE = 3;
        document.CDATA_SECTION_NODE = 4;
        document.ENTITY_REFERENCE_NODE = 5;
        document.ENTITY_NODE = 6;
        document.PROCESSING_INSTRUCTION_NODE = 7;
        document.COMMENT_NODE = 8;
        document.DOCUMENT_NODE = 9;
        document.DOCUMENT_TYPE_NODE = 10;
        document.DOCUMENT_FRAGMENT_NODE = 11;
        document.NOTATION_NODE = 12;
    }

    var IEimportNode = function(node, allChildren) {
        /* find the node type to import */
        switch (node.nodeType) {
            case document.ELEMENT_NODE:
                /* create a new element */
                var newNode = document.createElement(node.nodeName);
                /* does the node have any attributes to add? */
                if (node.attributes && node.attributes.length > 0) {
                    /* add all of the attributes */
                    for (var i = 0, il = node.attributes.length; i < il;) {
                        var attrName = node.attributes[i].nodeName;
                        var attrValue = node.getAttribute(node.attributes[i++].nodeName);
                        if (attrName === "style") {
                            newNode.style.cssText = attrValue;
                        } else {
                            newNode.setAttribute(attrName, attrValue);
                        }
                    }
                }
                /* are we going after children too, and does the node have any? */
                if (allChildren && node.childNodes && node.childNodes.length > 0) {
                    /* recursively get all of the child nodes */
                    for (var j = 0, jl = node.childNodes.length; j < jl;) {
                        newNode.appendChild(IEimportNode(node.childNodes[j++], allChildren));
                    }
                }
                return newNode;
            case document.TEXT_NODE:
            case document.CDATA_SECTION_NODE:
            case document.COMMENT_NODE:
                return document.createTextNode(node.nodeValue);
        }
    };


    var _getTextContent = function(node) {
        var result = "";
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++) {
            if (children[i].nodeType == 3) {
                result += children[i].data;
            }
        }

        return result;
    };

    var deactivateChildren = function(node) {
        var children = node.getChildNodes();
        for (var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
            if (child.getNodeType() === Toronto.internal.WidgetTree.WIDGET_NODE ||
                child.getNodeType() === Toronto.internal.WidgetTree.ACTION_NODE) {
                child.deactivate();
            }
            else {
                deactivateChildren(child);
            }
        }
    };

    /**
    * @module toronto.widget
    * @class Repeater
    */
    Toronto.widget.core.v2_5_0.Repeater = function () {
        this.onAfterReRender = new Toronto.core.Event('Toronto.widget.core.v2_5_0.Repeater.onAfterReRender');
        this.onReRender = new Toronto.core.Event('Toronto.widget.core.v2_5_0.Repeater.onReRender');

        this._rerender = false;
        this._requiresReRender = false;
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Repeater, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.Repeater.superclass.startup.apply(this, arguments);

            this._showTimer = parseBoolean(this.getAttribute("show-timer"));
            this._containerElement = Toronto.widget.core.v2_5_0.Repeater.superclass.getContainerElement.apply(this);
            this._autoRefresh = parseBoolean(this.getAttribute("auto-refresh"));
            this._scrollToNew = parseBoolean(this.getAttribute("scroll-to-new"));
        },

        getContainerElement: function() {
            // We store a reference to this at startup, as we don't remove the event listener for this after re render
            // TODO: Use _ds.onRowCreated.removeEventHandler once it's implemented, so that this
            // repeater widget won't create a new one but still listen to events
            return this._containerElement;
        },

        bind: function (dataContext) {
            Toronto.widget.core.v2_5_0.Repeater.superclass.bind.apply(this, arguments);

            this._ds = dataContext.findDataset(this.getAttribute("dataset"));
            this._onRowCreatedHdlr = this._ds.onRowCreated.bindHandler(this.reRender, this, "Toronto.widget.core.v2_5_0.Repeater rowCreated handler");
            this._onRowDeletedHdlr = this._ds.onRowDeleted.bindHandler(this.reRender, this, "Toronto.widget.core.v2_5_0.Repeater rowDeleted handler");
            this._onContentsReplaceHdlr = this._ds.onContentsReplaced.bindHandler(this.reRender, this, "Repeater (DC: " + dataContext.getID() + ")");

            this.listenForEvents(this._autoRefresh);
        },

        listenForEvents : function (doListen) {
            doListen = parseBoolean(doListen);
            if (doListen) {
                this._onRowCreatedHdlr.enable();
                this._onRowDeletedHdlr.enable();
                this._onContentsReplaceHdlr.enable();
            } else {
                this._onRowCreatedHdlr.disable();
                this._onRowDeletedHdlr.disable();
                this._onContentsReplaceHdlr.disable();
            }
        },

        reRenderDone: function(){
            this._rerender = false;
            if (this._requiresReRender === true){
                this._requiresReRender = false;
                this.reRender();
            }

        },

        reRender: function() {
            if (this._rerender === true){
                this._requiresReRender = true;
                return;
            }

            this._rerender = true;
            var i;
            // deactivate repeater's children so they stop listening for further events - they are going to be re-rendered and refreshed
            deactivateChildren(this.getWidgetContext().getWidgetNode());

            // TODO: Use _ds.onRowCreated.removeEventHandler once it's implemented
            var parentNode = this.getContainerElement().parentNode;
            if (YAHOO.lang.isUndefined(parentNode) || YAHOO.lang.isNull(parentNode)) {
                return;
            }

            this.onReRender.fireEvent();

            var timer;
            if (this._showTimer) {
                timer = Toronto.internal.GlobalState.getTopLevelSystem().getTimer();
                timer.show();
            }

            if (!this.getWidgetContext()) { // Sanity
                return;
            }

            var sourceContextInfo = this.getSourceContextInfo(this.getWidgetContext().getWidgetNode());

            var screenPath      = sourceContextInfo.screenPath;
            var screenNodeXPath = sourceContextInfo.screenNodeXPath;

            var nestedDocumentLocationsStr = "";
            var nestedDocumentLocations = sourceContextInfo.nestedDocumentLocations;
            for (i = 0; i<sourceContextInfo.nestedDocumentLocations.length; i++) {
                nestedDocumentLocationsStr += nestedDocumentLocations[i].documentPath + "::" + nestedDocumentLocations[i].nodeXPath + ",";
            }

            var dataContextsToRemoveStr = "";
            var dataContextsToRemove = this.getDataContextsToRemove();
            for (i = 0; i<dataContextsToRemove.length; i++) {
                dataContextsToRemoveStr += dataContextsToRemove[i] + ",";
            }

            // Need to create a new copy of the screen rendering context when re-rendering, so we send
            // back the screen rendering prefix to use; can't use closest dc node's rendering context,
            // as there could be a subscreen between the node being re-rendered and the closest dc node
            // TODO: Send proper screen rendering context knowledge to the screen, so it can be sent back
            var widgetID = this.getWidgetContext().getWidgetNode().getWidgetID().toLowerCase();
            var screenRenderingPrefix = this.getWidgetContext().getWidgetNode().getWidgetTree()._rootNamespace;
            if (widgetID.indexOf(":") !== -1) {
                screenRenderingPrefix = widgetID.split(":")[0];
            }

            Logging.log(Logging.SYSTEM, "Rendering partial screen: " + screenPath + " : " + screenNodeXPath);

            // The function that will be called just before we actually make the AJAX request.
            // We queue the requests, so need to ensure dataset postback string is generated
            // after all pending requests have been sent and and responses received
            // otherwise the server and client could get out of sync. See Bug 5085
            var dataContext = this.getCurrentDataContext();
            var formFields = {"screenPath"          : screenPath,
                              "screenNodeXPath"     : screenNodeXPath,
                              "documentLocations"   : nestedDocumentLocationsStr,
                              "dataContextsToRemove": dataContextsToRemoveStr,
                              "screenRenderingPrefix": screenRenderingPrefix};

            var deltaSnapshotList = dataContext.createDeltaSnapshotList();

            var renderHdlr = new Toronto.widget.core.v2_5_0.Repeater.renderHandler(this, timer, formFields);

            var genRequest = function() {
                return renderHdlr.generateRequestStringFunc(deltaSnapshotList);
            };

            var urlFunc = function () {
                return Toronto.internal.GlobalState.getServerStateKID();
            };

            if (Toronto.internal.GlobalState.isInsideDebugger()) {
                // Because the debugger only executes one AJAX call at a time (for now)
                // We can execute generateRequestStringFunc to generate the request string
                // TODO: We should really put this logic into the AJAX connection manager
                // so that it can manage the queues of AJAX calls
                parent.Aviarc._debuggerAjaxRequestQueued(urlFunc, renderHdlr.success, genRequest, renderHdlr);
                return;
            }

            var requestParams = {success: renderHdlr.success, failure: renderHdlr.failure, argument: genRequest, scope: renderHdlr};

            var ajaxRequest = new Toronto.internal.ajax.AjaxRequest('POST',
                                                                    urlFunc,
                                                                    requestParams,
                                                                    genRequest);

            Toronto.internal.ajax.AjaxConnectionManager.doAjaxRequest(ajaxRequest);
        },

        _makeSnapshotListUpdateString: function(deltaSnapshotList) {
            var contextUpdates = [];
            var contextList, contextId, datasetList, datasetUpdates, dataset, deltaID;
            for (var contextIndex = 0; contextIndex < deltaSnapshotList.length; contextIndex++) {
                contextList = deltaSnapshotList[contextIndex];
                contextId = contextList.contextID;
                datasetList = contextList.updates;
                datasetUpdates = [];
                for (var datasetIndex = 0; datasetIndex < datasetList.length; datasetIndex++) {
                    dataset = datasetList[datasetIndex].dataset;
                    deltaID = datasetList[datasetIndex].deltaID;
                    datasetUpdates.push(this._makeDatasetUpdateString(dataset, deltaID));

                }
                contextUpdates.push(contextId + _datacontextDelimiter + datasetUpdates.join(_datasetDelimiter));
            }
            return contextUpdates.join(_datacontextSeparator);
        },

        _makeDatasetUpdateString: function(dataset, deltaID) {
            var deltaList = dataset.getDeltaManager().getDeltasSinceServer(deltaID);
            var deltaStringList = [];
            for (var i = deltaList.length - 1; i >= 0; i--) {
                deltaStringList.push(deltaList[i].serialize());
            }
            var datasetUpdateString = dataset.makeServerUpdateString(deltaStringList.join(","));
            return datasetUpdateString;
        },

        _makeSnapshotListPostbackString: function(deltaSnapshotList) {
            var result = [];
            result.push("[");
            var contextList, contextId, datasetList, datasetUpdates, dataset, deltaID;
            for (var contextIndex = 0; contextIndex < deltaSnapshotList.length; contextIndex++) {
                if (contextIndex > 0) { result.push(","); }
                contextList = deltaSnapshotList[contextIndex];
                result.push("{ contextId:'" + contextList.contextID + "'," );
                result.push(    "updates:" + this._makeDatasetSnapshotListPostbackString(contextList.updates));
                result.push("}");
            }
            result.push("]");
            return result.join("");

        },

        _makeDatasetSnapshotListPostbackString: function(datasetSnapshotList) {
            var result = [];
            result.push("[");
            var datasetSnapshot;
            for (var i = 0; i < datasetSnapshotList.length; i++) {
                datasetSnapshot = datasetSnapshotList[i];
                if (i > 0) { result.push(","); }
                result.push(this._makeDatasetDeltaPostbackString(datasetSnapshot.dataset, datasetSnapshot.deltaID));
            }
            result.push("]");
            return result.join("");
        },

        _makeDatasetDeltaPostbackString: function(dataset, deltaID) {
            var deltaList = dataset.getDeltaManager().getDeltasSinceServer(deltaID);
            return "{" +
                    "name: '" + dataset.getName() + "'" +
                    ",deltaList: " +this._makeDeltaListPostbackString(deltaList) +
                    "}";
        },

        _makeDeltaListPostbackString: function(deltaList) {
            var result = [];
            result.push("[");
            // We write it in reverse order as the server needs it oldest first
            for (var i = deltaList.length - 1; i >= 0; i--) {
                if (i < (deltaList.length - 1)) { result.push(","); }
                result.push(deltaList[i].makeServerPostbackString());
            }
            result.push("]");
            return result.join("");
        },

        getNestedDocumentLocation : function (currentSourceContext) {
            var documentPath = currentSourceContext.getDocumentPath();
            var nodeXPath  = currentSourceContext.getElementPath();

            return {"documentPath" : documentPath, "nodeXPath" : nodeXPath};
        },

        getDataContextsToRemove : function() {
            var dataContextsToRemove = [];

            // find all child data contexts of this widgets parent data context
            var parentDataContext = this.getCurrentDataContext();
            var childDataContexts = parentDataContext.getAllChildContexts();


            // for each child, figure out if it is inside this fragment of the widget tree,
            // if it is, then it needs to be deleted on the server side datacontext tree and
            for (var i=0; i<childDataContexts.length; i++) {
                if (this._hasWidgetAsAncestor(childDataContexts[i].getDataContextProxyNode())) {
                    dataContextsToRemove.push(childDataContexts[i].getID());
                }
            }

            return dataContextsToRemove;
        },

        _hasWidgetAsAncestor : function(dataContext) {
            var node = dataContext;
            while (node) {
                if (node == this.getWidgetContext().getWidgetNode()) {
                    return true;
                }
                node = node.getParentNode();
            }

            return false;
        },

        /**
         * Go up the tree of source context nodes. We need to find the closest screen node,
         * so that we can re-render from the compiled tree of the appropriate screenImpl.
         * We also need all of the nested template document locations.
         */
        getSourceContextInfo : function (widgetNode) {
            var currentSourceContext = widgetNode.getXMLContext().getSourceContext();
            var nestedDocumentLocations = [];
            var currentNestedDoc = "";

            while (currentSourceContext && currentSourceContext.getDocumentType() != "screen") {
                if (currentSourceContext.getDocumentType() == "widget-template") {
                    if (currentNestedDoc != currentSourceContext.getDocumentPath()) {
                        nestedDocumentLocations.unshift(this.getNestedDocumentLocation(currentSourceContext));
                        currentNestedDoc = currentSourceContext.getDocumentPath();
                    }
                }

                widgetNode = widgetNode.getParentWidget();
                currentSourceContext = widgetNode.getXMLContext().getSourceContext();
            }

            var documentPath = currentSourceContext.getDocumentPath();
            documentPath = documentPath.replace("screens/", "");
            var nodeXPath  = currentSourceContext.getElementPath();

            return {"screenPath" : documentPath, "screenNodeXPath" : nodeXPath, "nestedDocumentLocations" : nestedDocumentLocations};
        }

    });

    Toronto.widget.core.v2_5_0.Repeater.renderHandler = function (repeater, timer, formFields) {
        this.repeater = repeater;
        this.timer = timer;
        this.formFields = formFields;
    };

    Toronto.widget.core.v2_5_0.Repeater.renderHandler.prototype = {
        success: function(response) {
            this.repeater.reRenderDone();
            // console.log("Ajax success");
            var xml = response.responseXML;
            var text = response.responseText;

            var me = this;
            var handleMalformedResponse = function(problem) {
                var message = "Malformed AJAX response, " + problem + ":\n" + text;
                console.log(message);

                if (me.repeater._showTimer && !L.isUndefined(me.timer)) {
                    me.timer.hide();
                }

                me._handleAjaxError(message);
            };

            // Check that we got a valid response
            if (xml === null || xml === undefined) {
                handleMalformedResponse("no xml in response");
                return;
            }

            // If a generic 'ajaxresponse', then handle redirects correctly
            var ajaxresponse = xml.firstChild;
            if (ajaxresponse !== null && ajaxresponse !== undefined && ajaxresponse.tagName === "ajaxresponse") {
                var firstChild = ajaxresponse.firstChild;
                if (firstChild === null || firstChild === undefined) {
                    handleMalformedResponse("ajaxresponse document has no first child");
                    return;
                }

                // Switch on element type
                if (firstChild.tagName === "redirect") {
                    this._handleAjaxRedirectElement(firstChild);
                    return;
                } else if (firstChild.tagName === "error") {
                    this._handleAjaxErrorElement(firstChild);
                    return;
                }

                handleMalformedResponse("unknown response type");
                return;
            }

            // Otherwise, we expect an HTML document with newly rendered content
            var htmlEls = xml.getElementsByTagName("html");
            if (YAHOO.lang.isUndefined(htmlEls) || YAHOO.lang.isNull(htmlEls) || htmlEls.length < 1) {
                handleMalformedResponse("No html found");
                return;
            }

            var html = htmlEls[0];

            var headEls = html.getElementsByTagName("head");
            if (YAHOO.lang.isUndefined(headEls) || YAHOO.lang.isNull(headEls) || headEls.length < 1) {
                handleMalformedResponse("No head element found");
                return;
            }

            var scriptEls = headEls[0].getElementsByTagName("script");
            if (YAHOO.lang.isUndefined(scriptEls) || YAHOO.lang.isNull(scriptEls) || scriptEls.length < 3) {
                handleMalformedResponse("Not enough script tags");
                return;
            }

            // Get the 2nd last script tag; there may be new script includes above the inline script declarations
            var dataRulesInitScriptTag;
            if (scriptEls.length > 5){
                dataRulesInitScriptTag = scriptEls[scriptEls.length - 6];
            }
            var newWidgetTreeScriptTag = scriptEls[scriptEls.length - 5];
            var dataContextTreeInfoScriptTag = scriptEls[scriptEls.length - 4];
            var newDataRulesScriptTag = scriptEls[scriptEls.length - 3];
            var datasetUpdateScriptTag = scriptEls[scriptEls.length - 2];
            var newDatasetScriptTag = scriptEls[scriptEls.length - 1];

            var dataContextTree = this.repeater.getCurrentDataContext().getDataContextTree();
            var datasetUpdates;
            try {
                eval(_getTextContent(datasetUpdateScriptTag)); // creates variable 'datasetUpdates'
            } catch (e) {
                handleMalformedResponse("Error applying new datasets updates: " + e + " : " + datasetUpdates);
                return;
            }

            dataContextTree.updateFromAjaxResponse(datasetUpdates);
            var i;

            // Copy all the new script tags from the re-rendered fragment into the current HTML document
            var scriptUrls = [];
            for (i=0; i<scriptEls.length - 3; i++) {
                var scriptEl = scriptEls[i];
                var src = scriptEl.getAttribute("src");

                scriptUrls.push(src);
            }

            // Copy all the new CSS link tags from the re-rendered fragment into the current HTML document
            var cssUrls = [];
            var linkEls = headEls[0].getElementsByTagName("link");
            for (i=0; i<linkEls.length; i++) {
                var linkEl = linkEls[i];
                var href = linkEl.getAttribute("href");

                cssUrls.push(href);
            }

            var bodyEls = html.getElementsByTagName("body");
            if (YAHOO.lang.isUndefined(bodyEls) || YAHOO.lang.isNull(bodyEls) || bodyEls.length < 1) {
                handleMalformedResponse("No Body");
                return;
            }

            var body = bodyEls[0];

            var nextKId = body.getAttribute("nextKId");
            if (YAHOO.lang.isUndefined(nextKId) || YAHOO.lang.isNull(nextKId) || nextKId === "") {
                 handleMalformedResponse("No next KID");
                 return;
            }

            // Update the next KID: Needs to happen before we update the tree,
            // in case there are ajax calls in the onContentsReplaced event handlers
            Toronto.internal.GlobalState.setServerStateKID(nextKId);

            if (Toronto.internal.GlobalState.isInsideDebugger()) {
                parent.Aviarc._debuggerNotifyAjaxRequestComplete(nextKId, "ajax-response", null);
            }

            var bodyContents = body.firstChild;
            if (YAHOO.lang.isUndefined(bodyContents) || YAHOO.lang.isNull(bodyContents) || bodyContents === "") {
                 handleMalformedResponse("No body contents");
                 return;
            }

            var currentHTMLNode = this.repeater.getContainerElement();
            if (YAHOO.lang.isUndefined(currentHTMLNode) || YAHOO.lang.isNull(currentHTMLNode)) {
                handleMalformedResponse("Can't find repeater: " + this.repeater.getWidgetID());
                return;
            }

            if (YAHOO.lang.isUndefined(currentHTMLNode.parentNode) || YAHOO.lang.isNull(currentHTMLNode.parentNode)) {
                handleMalformedResponse("The repeater has been removed from the DOM");
                return;
            }

            var downloadHdlr = new Toronto.widget.core.v2_5_0.Repeater.downloadHandler(this.repeater, scriptUrls, newDatasetScriptTag, newDataRulesScriptTag,
                                                                                       dataContextTreeInfoScriptTag, newWidgetTreeScriptTag,
                                                                                       nextKId, bodyContents, currentHTMLNode, this.timer, dataRulesInitScriptTag);

            // Download all new CSS files
            YAHOO.util.Get.css(cssUrls, {
                onSuccess: function() {  }
            });

            downloadHdlr.startScriptDownload();
         },

         failureFunc: function(o) {
            var errorString;
            if (o.status === 0)  { // Communication failure
                errorString = "Communication failure during background request.  Please retry your action.";
            } else if (o.status === -1) {  // This is an abort, only a timeout can cause this case to occur here
                errorString = "Timeout reached during background request.  Please retry your action.";
            } else {
                errorString = "Error code '" + o.status + ": " + o.statusText + "' during submitScreen background request.  Please retry your action.";
            }

            if (this.repeater._showTimer && !L.isUndefined(this.timer)) {
                this.timer.hide();
            }

            this.repeater.reRenderDone();
            // call failure handler
            alert(errorString);
        },

        generateRequestStringFunc: function(deltaSnapshotList) {
            var dataContext = this.repeater.getCurrentDataContext();
            var dsString = this.repeater._makeSnapshotListPostbackString(deltaSnapshotList);


            var requestString = "";
            if (this.formFields) {
                if (typeof(this.formFields) === 'object') {
                    for (var name in this.formFields) {
                        requestString += escape(name) + "=" + escape(this.formFields[name]) + "&";
                    }
                } else if (typeof(this.formFields) === 'string') {
                    requestString = this.formFields + "&";
                }
            }

            var clientID = this.repeater.getWidgetContext().getSystem()._getClientID();
            var clientIDField = clientID ? ("Aviarc.clientID=" + clientID + "&") : "";
            var validate = "n"; // Default to no, as you don't want validation to get in the way of re-rendering

            requestString += clientIDField + "Aviarc.action=PartialRender" +
                             "&Aviarc.datasets=" + escape(dsString) +
                             "&Aviarc.dataContext=" + escape(dataContext.getID()) +
                             "&Aviarc.serverValidate=" + escape(validate);

            return requestString;
        },

        _handleAjaxRedirectElement: function(redirectElement) {
            var url = redirectElement.textContent || redirectElement.text;
            var hideTimer = (redirectElement.getAttribute("suppressTimer") == "y");
            if (hideTimer) {
                this.timer.hide();
            }
            window.location.href = url;
        },

        _handleAjaxErrorElement: function(errorElement) {
            // An error message has been returned, display it in a friendly way....
            var errorMessage = errorElement.textContent || errorElement.text;
            this._handleAjaxError(errorMessage);
        },

        _handleAjaxError : function (message) {
            var eventResults = this.repeater.getWidgetContext().getSystem().onAjaxError.fireEvent({'message':message});
            if (this._checkEventResult(eventResults)){
                alert("An error occurred during the server request: \n" + message);
            }
        },

        _checkEventResult: function(result){
            for(var i = 0; i < result.length; i ++){
                // event was canceled
                if(result[i] === false){
                    return false;
                }

            }
            return true;
        }
    };


    Toronto.widget.core.v2_5_0.Repeater.downloadHandler = function (repeater, scriptUrls, newDatasetScriptTag, newDataRulesScriptTag,
                                                                    dataContextTreeInfoScriptTag, newWidgetTreeScriptTag, nextKId,
                                                                    bodyContents, currentHTMLNode, timer, dataRulesInitScriptTag) {
        this.repeater = repeater;
        this.scriptUrls = scriptUrls;
        this.newDatasetScriptTag = newDatasetScriptTag;
        this.newDataRulesScriptTag = newDataRulesScriptTag;
        this.dataContextTreeInfoScriptTag = dataContextTreeInfoScriptTag;
        this.newWidgetTreeScriptTag = newWidgetTreeScriptTag;
        this.dataRulesInitScriptTag = dataRulesInitScriptTag;
        this.nextKId = nextKId;
        this.bodyContents = bodyContents;
        this.currentHTMLNode = currentHTMLNode;
        this.timer = timer;
    };

    Toronto.widget.core.v2_5_0.Repeater.downloadHandler.prototype = {
        startScriptDownload: function() {
            YAHOO.util.Get.script(this.scriptUrls, {
                onSuccess: this.newScriptDownloadSuccessHandler,
                scope: this
            });
        },

        // Then append the new HTML fragment and run the new inline js to initialise
        newScriptDownloadSuccessHandler: function() {
            // console.log("scripts downloaded");

            var dataRules;
            try {
                eval(_getTextContent(this.newDataRulesScriptTag));
            } catch (e) {
                handleMalformedResponse("Error applying new data rule updates: " + e + " : " + dataRules);
                return;
            }

            if (this.dataRulesInitScriptTag !== undefined){
                try {
                     eval(_getTextContent(this.dataRulesInitScriptTag));
                } catch (e) {
                    handleMalformedResponse("Error applying new data rule updates: " + e + " : " + dataRules);
                    return;
                }
            }

            // Update data contexts
            var dataContextTree = this.repeater.getCurrentDataContext().getDataContextTree();
            var newDatasets;
            try {
                eval(_getTextContent(this.newDatasetScriptTag)); // creates variable 'datasetUpdates'
            } catch (e) {
                console.log("ERROR");
                console.log(this.newDatasetScriptTag, e);
                handleMalformedResponse("Error applying dataset updates: " + e + " : " + this.datasetUpdateScriptTag);
                return;
            }
            dataContextTree.processNewDatasetsFromAjaxResponse(newDatasets, dataRules);

            // Update the top level data context
            var dataContextTreeInfo;
            try {
                eval(_getTextContent(this.dataContextTreeInfoScriptTag)); // creates variable 'dataContextTreeInfo'
            } catch (e) {
                alert("Malformed datacontext tree info: " + e);
                alert("Malformed datacontext tree info: " + this.dataContextTreeInfoScriptTag);
                console.log("Malformed datacontext tree info:");
                console.log(this.dataContextTreeInfoScriptTag);
                return;
            }

            // Replace the html
            var importedNode = IEimportNode(this.bodyContents, true);
            var holderDiv = document.createElement("div");
            holderDiv.innerHTML = '';
            holderDiv.appendChild(importedNode);
            if (!document.importNode) { // Copy events in IE
                holderDiv.innerHTML = holderDiv.innerHTML;
            }

            this.currentHTMLNode.innerHTML = '';

            var replacementHTMLNode = holderDiv.firstChild;
            while (replacementHTMLNode.firstChild) {
                this.currentHTMLNode.appendChild(replacementHTMLNode.firstChild);
            }

            if (this.repeater._scrollToNew && this.currentHTMLNode.lastChild) {
                this.currentHTMLNode.lastChild.scrollIntoView();
            }

            // Evaluate the widget tree script, and update the widget tree
            var partialWidgetStructure;
            eval(_getTextContent(this.newWidgetTreeScriptTag)); // creates variable 'partialWidgetStructure'

            // replace the children in the widget tree
            var widgetTree = Toronto.internal.GlobalState.getWidgetTree();
            widgetTree.updateChildren(partialWidgetStructure, this.repeater.getWidgetID(), dataContextTreeInfo);

            this.repeater.listenForEvents(this.repeater._autoRefresh);
            this.repeater.onAfterReRender.fireEvent();

            if (this.repeater._showTimer && !L.isUndefined(this.timer)) {
                this.timer.hide();
            }
        }
    };

    var _datasetDelimiter       = "&";
    var _datacontextDelimiter   = "#";
})();
