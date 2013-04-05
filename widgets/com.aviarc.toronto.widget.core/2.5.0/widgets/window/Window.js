/*global
YAHOO
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    var cssPrefix = "com-aviarc-toronto-widget-core_2-5-0_";

    var screenOffset;

    var constrainDimension = function (value, minValue, maxValue) {
        if (!isNaN(minValue) && value <= minValue) {
            return minValue;
        } else if (!isNaN(maxValue) && value >= maxValue) {
            return maxValue;
        } else {
            return value;
        }
    };

    var enableEventDiv = function (eventDiv) {
        eventDiv.style.width = YAHOO.util.Dom.getViewportWidth() + "px";
        eventDiv.style.height = YAHOO.util.Dom.getViewportHeight() + "px";
        eventDiv.className = cssPrefix + "window-event";
        // Move to the end of the DOM
        document.body.appendChild(eventDiv);
    };

    var setupResizeHandler = function (widgetContext, mouseMoveEvent, mouseUpEvent, eventDiv, resizerNode, containerNode, constraints, resizeEvent) {
        var mouseDownEvent = widgetContext.createManagedEvent('Window mouseDownEvent ManagedEvent (resize)');
        resizerNode.onmousedown = mouseDownEvent.makeDOMEventFunction();

        var elStartSize = [];
        var evStartPos = [];

        var applyDelta = function (delta) {
            var width = constrainDimension((elStartSize[0] + delta[0]), constraints.minWidth, constraints.maxWidth);
            var height = constrainDimension((elStartSize[1] + delta[1]), constraints.minHeight, constraints.maxHeight);
            containerNode.style.width = width + "px";
            containerNode.style.height = height + "px";
            resizeEvent.fireEvent({
                newWidth: width,
                newHeight: height
            });
        };

        var mouseMoveBinding = mouseMoveEvent.bindHandler(function (e) {
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }
            var pos = YAHOO.util.Event.getXY(e);
            var delta = [pos[0] - evStartPos[0], pos[1] - evStartPos[1]];
            applyDelta(delta);
        });
        mouseMoveBinding.disable();

        var mouseUpBinding = mouseUpEvent.bindHandler(function (e) {
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }
            mouseMoveBinding.disable();
            mouseUpBinding.disable();
            eventDiv.className = "window-event display-none";
            elStartSize = [];
            evStartPos = [];
        });
        mouseUpBinding.disable();

        mouseDownEvent.bindHandler(function (e) {
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }
            elStartSize = [containerNode.clientWidth, containerNode.clientHeight];
            evStartPos = YAHOO.util.Event.getXY(e);
            enableEventDiv(eventDiv);
            mouseMoveBinding.enable();
            mouseUpBinding.enable();
        });
    };

    var setupMoveHandler = function (widgetContext, mouseMoveEvent, mouseUpEvent, eventDiv, headerNode, containerNode, captionButtons) {
        var mouseDownEvent = widgetContext.createManagedEvent('Window mouseDownEvent ManagedEvent (move)');
        headerNode.onmousedown = mouseDownEvent.makeDOMEventFunction();
        // if headerNode.onmousedown (!== captionButtons)
        var elStartPos = [];
        var evStartPos = [];

        var applyDelta = function (delta) {
            containerNode.style.left = elStartPos[0] + delta[0] - screenOffset[0] + "px";
            containerNode.style.top = elStartPos[1] + delta[1] - screenOffset[1] + "px";
        };

        var mouseMoveBinding = mouseMoveEvent.bindHandler(function (e) {
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }
            var pos = YAHOO.util.Event.getXY(e);
            var delta = [pos[0] - evStartPos[0], pos[1] - evStartPos[1]];
            applyDelta(delta);
        });
        mouseMoveBinding.disable();

        var mouseUpBinding = mouseUpEvent.bindHandler(function (e) {
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }
            mouseMoveBinding.disable();
            mouseUpBinding.disable();
            eventDiv.className = cssPrefix + "window-event display-none";
            elStartPos = [];
            evStartPos = [];
        });
        mouseUpBinding.disable();

        mouseDownEvent.bindHandler(function (e) {
            if (YAHOO.env.ua.gecko) {
                e.preventDefault();
            }

            elStartPos = YAHOO.util.Dom.getXY(containerNode);
            evStartPos = YAHOO.util.Event.getXY(e);
            enableEventDiv(eventDiv);
            mouseMoveBinding.enable();
            mouseUpBinding.enable();
        });
    };

    var stopEvent = function (e) {
        YAHOO.util.Event.stopEvent(e);
    };

    /* this.proxyDrag = (function () {
            var attrMode = me.attributes.dragMode;
            attrMode = attrMode ? attrMode.toLowerCase() : null;
            if (attrMode === "proxy") {
                return true;
            } else if (attrMode === "solid") {
                return false;
            } else {
                return YAHOO.env.ua.ie;
            }
        })();

	_startDragWithProxy: function (e) {
		if (YAHOO.env.ua.gecko) {
           e.preventDefault();
        }
        if (parseBoolean(this.attributes.movable)) { //check this line monday

            document.body.style.cursor = "move";
            var el = this.getContainerDiv();
            var startPoint = YAHOO.util.Event.getXY(e);
            var clientStartPos = YAHOO.util.Dom.getXY(el);
            //var startPos = [ parseInt(el.style.left, 10), parseInt(el.style.top, 10) ];

            if (!this._overlayDiv) {
                this._overlayDiv = document.createElement("div");
                this._overlayDiv.className = "window-drag-overlay";
            }
            if (!this._dragProxy) {
                this._dragProxy = document.createElement("div");
                this._dragProxy.className = "window-drag-proxy";
            }


            var overlayDiv = this._overlayDiv;
            overlayDiv.style.width = YAHOO.util.Dom.getViewportWidth() + "px";
            overlayDiv.style.height = YAHOO.util.Dom.getViewportHeight() + "px";
            document.body.appendChild(overlayDiv);

            var dragProxy = this._dragProxy;
            dragProxy.style.left = clientStartPos[0] + "px";
            dragProxy.style.top = clientStartPos[1] + "px";
            dragProxy.style.width = this.getWidth() + "px";
            dragProxy.style.height = this.getHeight() + "px";
            document.body.appendChild(dragProxy);

            var me = this;
            var mouseMove = function (e) {
                var pos = YAHOO.util.Event.getXY(e);
                var delta = [ pos[0] - startPoint[0], pos[1] - startPoint[1] ];

                if (clientStartPos[0] + delta[0] >= 0) {
                    dragProxy.style.left = clientStartPos[0] + delta[0] + "px";
                    //el.style.left = startPos[0] + delta[0] + "px";
                }
                if (clientStartPos[1] + delta[1] >= 0) {
                    dragProxy.style.top = clientStartPos[1] + delta[1] + "px";
                    //el.style.top = startPos[1] + delta[1] + "px";
                }
            };


            var parent = el.parentNode;
            var sibling = el.nextSibling;
            parent.removeChild(el);

            var moveHandler;
            //moveHandler = Util.addDOMEvent(overlayDiv, "onmousemove", function (e) {
			moveHandler = var overlayDivEvent = new toronto.client.Event();
			overlayDivEvent = overlayDivEvent.makeDomEventFunction(e) {
                mouseMove(e);
            });

            //Util.addDOMEvent(overlayDiv, "onmouseup", function (e, node) {
			var overlayDivEvent = new toronto.client.Event();
			overlayDivEvent = overlayDivEvent.makeDomEventFunction(e) {
                var pos = YAHOO.util.Event.getXY(e);
                var delta = [ pos[0] - startPoint[0], pos[1] - startPoint[1] ];

                document.body.removeChild(overlayDiv);
                document.body.removeChild(dragProxy);
                parent.insertBefore(el, sibling);
                el.style.right = "";
                YAHOO.util.Dom.setXY(el, [ clientStartPos[0] + delta[0],
                                           clientStartPos[1] + delta[1] ]);
                moveHandler.remove();


                document.body.style.cursor = "auto";

            });
        }
    }, */

	/*_startResizeWithProxy: function (e, constraints) {
		if (YAHOO.env.ua.gecko) {
           e.preventDefault();
        }
        var startPoint = YAHOO.util.Event.getXY(e);

        if (!this._overlayDiv) {
            this._overlayDiv = document.createElement("div");
            this._overlayDiv.className = "window-drag-overlay";
        }
        if (!this._proxyDiv) {
            this._proxyDiv = document.createElement("div");
            this._proxyDiv.className = "window-resize-proxy";
        }

        var proxyDiv = this._proxyDiv;
        var overlayDiv = this._overlayDiv;

        overlayDiv.style.width = YAHOO.util.Dom.getViewportWidth() + "px";
        overlayDiv.style.height = YAHOO.util.Dom.getViewportHeight() + "px";
        proxyDiv.style.width = this.getWidth() + "px";
        proxyDiv.style.height = this.getHeight() + "px";

        document.body.appendChild(proxyDiv);
        document.body.appendChild(overlayDiv);

        YAHOO.util.Dom.setXY(proxyDiv, YAHOO.util.Dom.getXY(this.containerDiv));

        var elementDiv = this.containerDiv;
        var elementStartSize = [];
        elementStartSize[0] = elementDiv.clientWidth ? elementDiv.clientWidth : parseInt(YAHOO.util.Dom.getStyle(elementDiv, "width"), 10);
        elementStartSize[1] = elementDiv.clientHeight ? elementDiv.clientHeight : parseInt(YAHOO.util.Dom.getStyle(elementDiv, "height"), 10);

        var me = this;
        var mouseMove = function (e) {
            var pos = YAHOO.util.Event.getXY(e);
            var delta = [ pos[0] - startPoint[0], pos[1] - startPoint[1] ];
            me._proxyDiv.style.width = constrainDimension((elementStartSize[0] + delta[0]), constraints.minWidth, constraints.maxWidth) + "px";
            me._proxyDiv.style.height = constrainDimension((elementStartSize[1] + delta[1]), constraints.minHeight, constraints.maxHeight) + "px";
        };

        var moveHandler = [];
        moveHandler.push(Util.addDOMEvent(overlayDiv, "onmousemove", function (e) {
            mouseMove(e);
        }));

      /*
		var overlayDivEvent = new Toronto.client.Event(e, node);
		overlayDiv.onmouseup = overlayDivEvent.makeDomEventFunction(e){


            var proxySize = [ parseInt(proxyDiv.style.width, 10), parseInt(proxyDiv.style.height, 10) ];
            var delta = [ proxySize[0] - elementStartSize[0], proxySize[1] - elementStartSize[1] ];
            me.contentDiv.style.display = "none";
            me.resize((elementStartSize[0] + delta[0]), (elementStartSize[1] + delta[1]));
            me.contentDiv.style.display = "block";
            for (var i = 0; i < moveHandler.length; i += 1) {
                moveHandler[i].remove();
                document.body.style.cursor = "auto";
            }
            //me.containerDiv.removeChild(me._proxyDiv);
            document.body.removeChild(me._overlayDiv);
            document.body.removeChild(me._proxyDiv);

            me.raiseEvent("onResize", {
                widget: me
            });
        });
    },*/

    /**
    * @module toronto.widget
    * @class TextEdit
    */
    Toronto.widget.core.v2_5_0.Window = function () {
        this.onBeforeClose = new Toronto.client.Event('Window onBeforeClose');
        this.onBeforeMinimize = new Toronto.client.Event('Window onBeforeMinimize');
        this.onBeforeMaximize = new Toronto.client.Event('Window onBeforeMaximize');
        this.onClose = new Toronto.client.Event('Window onClose');
        this.onResize = new Toronto.client.Event('Window onResize');
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Window, Toronto.framework.DefaultWidgetImpl, {

        _setMinimizeState: function () {
            var minimizable = parseBoolean(this.attributes.minimizable) && !isNaN(this.constraints.minimizedWidth) && !isNaN(this.constraints.minimizedHeight);
            if (this._isMinimizable) {
            YAHOO.util.Dom.addclass(this.captionButtons.minimize, "display-none");
            } else {
            YAHOO.util.Dom.removeclass(this.captionButtons.minimize, "display-none");//?
            }
        },

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.Window.superclass.startup.apply(this, arguments);

            this.constraints = {
                minHeight: parseInt(this.getAttribute('min-height'), 10),
                minWidth: parseInt(this.getAttribute('min-width'), 10),
                maxHeight: parseInt(this.getAttribute('max-height'), 10),
                maxWidth: parseInt(this.getAttribute('max-width'), 10),
                minimizedHeight: parseInt(this.getAttribute('minimized-height'), 10),
                minimizedWidth: parseInt(this.getAttribute('minimized-width'), 10)
            };

            this._isClosable = parseBoolean(this.getAttribute('closable'));

            this._headerNode    = this.getNamedElement("header:div");
            this._containerNode = this.getNamedElement("div");
            this._resizerNode   = this.getNamedElement("resizer:div");
            this._contentNode   = this.getNamedElement("content:div");

            this._titleNode     = this.getNamedElement("title");
            this._title         = this.getAttribute("title");

            // Create captionButtons
            this.captionButtons = {
                close:      this.getNamedElement("caption-close:div"),
                minimize:   this.getNamedElement("caption-minimize:div"),
                maximize:   this.getNamedElement("caption-maximize:div")
            };

            // Create event catcher div
            this._eventDiv = document.createElement("div");
            this._eventDiv.className = cssPrefix + "window-event display-none";
            document.body.appendChild(this._eventDiv);


            // Shared events must be set up here - mousemove on event div, mouseup on document
            var mouseUpEvent = widgetContext.createManagedEvent('Window mouseUpEvent ManagedEvent');
            var mouseMoveEvent = widgetContext.createManagedEvent('Window mouseMoveEvent ManagedEvent');
            this._eventDiv.onmousemove = mouseMoveEvent.makeDOMEventFunction();
            this._eventDiv.onmouseup = mouseUpEvent.makeDOMEventFunction();

            // If movable, set up event handlers, otherwise ensure we don't show the move cursor
            if (parseBoolean(this.getAttribute("movable"))) {
                setupMoveHandler(widgetContext, mouseMoveEvent, mouseUpEvent, this._eventDiv, this._headerNode,
                                 this._containerNode, this.captionButtons, this._startDragWithProxy, this.proxyDrag);
            } else {
                if (this._headerNode && this._headerNode.lastChild) {
                    this._headerNode.lastChild.style.cursor = "default";
                }
            }

            // If resizable, set up event handlers
            if (parseBoolean(this.getAttribute("resizable"))) {
                setupResizeHandler(widgetContext, mouseMoveEvent, mouseUpEvent, this._eventDiv, this._resizerNode,
                                   this._containerNode, this.constraints, this.onResize);
            }

			//setupMoveHandlerWithProxy(mouseMoveEvent, mouseUpEvent, this._eventDiv, this.proxyDrag this._containerNode, this.captionbuttons
			//Handlers for moving and resizing
			//Util.addDOMEvent(this.headerDiv, "onmousedown", this.proxyDrag ? this._startDragWithProxy : this._startDrag, this);
			//Util.addDOMEvent(this.resizeDiv, "onmousedown", this.proxyDrag ? this._startResizeWithProxy : this._startResize, this);


            // It is safe to add the handlers regardless of if the actions are allowed, 'display: none' buttons cannot be clicked
			//Util.addDOMEvent(this.captionButtons.close, "onmousedown", this._cancelEvent, this);
            var closeButtonEvent = widgetContext.createManagedEvent('Window closeButtonEvent ManagedEvent');
            this.captionButtons.close.onclick = closeButtonEvent.makeDOMEventFunction();
            closeButtonEvent.bindHandler(this._close, this);

            var minimizeButtonEvent = widgetContext.createManagedEvent('Window minimizeButtonEvent ManagedEvent');
            this.captionButtons.minimize.onclick = minimizeButtonEvent.makeDOMEventFunction();
            minimizeButtonEvent.bindHandler(this.minimize, this);

            var maximizeButtonEvent = widgetContext.createManagedEvent('Window maximizeButtonEvent ManagedEvent');
            this.captionButtons.maximize.onclick = maximizeButtonEvent.makeDOMEventFunction();
            maximizeButtonEvent.bindHandler(this.maximize, this);


            var mouseDownCancelEvent = widgetContext.createManagedEvent('Window mouseDownCancelEvent ManagedEvent');
            this.captionButtons.close.onmousedown = mouseDownCancelEvent.makeDOMEventFunction();
            this.captionButtons.minimize.onmousedown = mouseDownCancelEvent.makeDOMEventFunction();
            this.captionButtons.maximize.onmousedown = mouseDownCancelEvent.makeDOMEventFunction();
            mouseDownCancelEvent.bindHandler(stopEvent);

            // Can't allow minimising if minimum size is not specified
            this._isMinimizable =
                    parseBoolean(this.getAttribute('minimizable')) &&
                    !isNaN(this.constraints.minimizedWidth) &&
                    !isNaN(this.constraints.minimizedHeight);
            this._isResizable = parseBoolean(this.resizable);

            /* _cancelEvent: function (e) {
                YAHOO.util.Event.stopEvent(e);
            }, */

            var body = document.body;
            body.appendChild(this._containerNode);
            screenOffset = [ body.offsetLeft, body.offsetTop ];

            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);
        },

        _cleanup: function () {
            this.captionButtons.close.onmousedown     = null;
            this.captionButtons.minimize.onmousedown  = null;
            this.captionButtons.maximize.onmousedown  = null;
            this.captionButtons.close.onclick         = null;
            this.captionButtons.minimize.onclick      = null;
            this.captionButtons.maximize.onclick      = null;
            this.captionButtons.close                 = null;
            this.captionButtons.minimize              = null;
            this.captionButtons.maximize              = null;

            this._eventDiv.onmousemove    = null;
            this._eventDiv.onmouseup      = null;
            this._eventDiv                = null;

            this._headerNode.onmousedown  = null;
            this._resizerNode.onmousedown = null;

            this._resizerNode     = null;
            this._containerNode   = null;
            this._headerNode      = null;
            this._contentNode     = null;
            this._titleNode       = null;
        },

        maximize: function () {
            // Don't allow maxmise on already maximized window since savedSize will be blank checked
            if (parseBoolean(this.isMinimized)) {
                // If any of the handlers returns false, don't maximise it
                var windowWidget = this;
                var values = this.onBeforeMaximize.fireEvent({
                    widget: windowWidget
                });
                for (var i = 0; i < values.length; i += 1) {
                    if (values[i] === false) {
                        return;
                    }
                }

                // Restore size constraints
                this.constraints.minHeight = parseInt(this.getAttribute('min-height'), 10);
                this.constraints.minWidth = parseInt(this.getAttribute('min-width'), 10);
                // Only restore resizable state if allowed
                if (this._isResizable) {
                    this.setResizable(true);
                }
                // Swap buttons
				YAHOO.util.Dom.removeClass(this.captionButtons.minimize, "display-none");

                YAHOO.util.Dom.addClass(this.captionButtons.maximize, "display-none");

                this.resize(this.savedSize.width, this.savedSize.height);
                // Show window content
                YAHOO.util.Dom.removeClass(this.getContentElement(), "display-none");
                // Clear saved size to avoid issues in the future
                this.savedSize = {};
                this.isMinimized = false;

                var windowWidget = this;

            }
            // Give focus on maximize.  Makes window behaviour more desktop window manager like
            //this.windowManager.getFocus(this);
        },

        minimize: function () {
            // Don't allow calling minimize if the window is already minimized
            if (parseBoolean(this._isMinimizable && !this.isMinimized)) {
                // If any of the handlers returns false, don't minimize it
                var windowWidget = this;
                var values = this.onBeforeMinimize.fireEvent({
                    widget: windowWidget
                });
                for (var i = 0; i < values.length; i += 1) {
                    if (values[i] === false) {
                        return;
                    }
                }

                // Size is saved here for restoring later
                this.savedSize = {
                    width: parseInt(this.getContainerElement().style.width, 10),
                    height: parseInt(this.getContainerElement().style.height, 10)
                };

                this.constraints.minWidth = null;
                this.constraints.minHeight = null;
                // When minimized, resizer will be inactive
                // this._isResizable = parseBoolean(this.resizable);
                // this.setResizable(false);
                // Swap minimize for maximize button

                YAHOO.util.Dom.addClass(this.captionButtons.minimize, "display-none");
                //put on maximse button
                YAHOO.util.Dom.removeClass(this.captionButtons.maximize, "display-none");
                //this.captionButtons.maximize.style.display = "inline";
                // Hide window content
                YAHOO.util.Dom.addClass(this.getContentElement, "display-none");
                this.resize(this.constraints.minimizedWidth, this.constraints.minimizedHeight);
                this.isMinimized = true;
            }
        },

        // Public method to close window
	close : function() {
            this._close();
	},

        _close: function (e) {
            if (parseBoolean(this. getClosable())) {
                // If any of the handlers returns false, don't close it
                var windowWidget = this;
                var values = this.onBeforeClose.fireEvent({
                    widget: windowWidget
                });
                for (var i = 0; i < values.length; i += 1) {
                    if (values[i] === false) {
                        return;
                    }
                }
                this.onClose.fireEvent({
                    widget: windowWidget
                });
                this._widgetContext.getWidgetNode().hide();
            }
        },

        getContentElement: function() {
            return this._contentNode;
        },

        setMinimizedWidth: function (minimizedWidth) {
            minimizedWidth = parseInt(minimizedWidth, 10);
            this.attributes.minimizedWidth = minimizedWidth;
            this.constraints.minimizedWidth = minimizedWidth;
            if (this.isMinimized) {
                this.setWidth(minimizedWidth);
            }
            this._setMinimizeState();
        },

        getMinimizedWidth: function () {
            return this.constraints.minimizedWidth;
        },

        setClosable: function (closable) {
            closable = parseBoolean(closable);
            this.captionButtons.close.className = closable ? "cssPrefix + window-button-close" : "cssPrefix + window-button-close-disabled";
            this._isClosable = closable;
        },

        getClosable: function () {
            return this._isClosable;
        },

        setMinimizedHeight: function (minimizedHeight) {
            minimizedHeight = parseInt(minimizedHeight, 10);
            this.attributes.minimizedHeight = minimizedHeight;
            this.constraints.minimizedHeight = minimizedHeight;
            if (this.isMinimized) {
                this.setHeight(minimizedHeight);
            }
            this._setMinimizeState();
        },

        getMinimizedHeight: function () {
            return this.constraints.minimizedHeight;
        },

         // Again check the minimized sizes
        setMinimizable: function (minimizable) {
            minimizable = parseBoolean(minimizable);
            this.captionButtons.minimize.className = minimizable ? "cssPrefix + window-button-minimize" : "cssPrefix + window-button-minimize-disabled";
            this.attributes.minimizable = minimizable ? "y" : "n" ;
            this._setMinimizeState();
        },

        getMinimizable: function () {
            return this._isMinimizable ? "y" : "n";
        },

        getStyledElements: function () {
            var window = this;
            return Toronto.util.CssUtils.getChildElements(this.getContainerDiv(), function (el) {
                if (!YAHOO.lang.isUndefined(el.id) && el.id !== "" && !el.id.contains(window._id)) {
                    return -1;
                } else if (!YAHOO.lang.isUndefined(el.className) && el.className.contains(cssPrefix + "window")) {
                    return 1;
                } else {
                    return 0;
                }
            });
        },

        setTitle: function (title) {
            title = escapeHTML(title);
            this._title = title;
            this._titleNode.innerHTML = title;
        },

        getTitle: function () {
            return this._title;
        },

        resize: function (width, height) {
            var container = this.getContainerElement();
            container.style.width = width + "px";
            container.style.height = height + "px";
            this.onResize.fireEvent({
                newWidth: width,
                newHeight: height
            });
        }
    });

    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.Window, Toronto.util.CssUtils);
})();
