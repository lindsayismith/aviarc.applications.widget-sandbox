/*global
YAHOO
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
    * @module toronto.widget 
    * @class GroupBox
    */
    Toronto.widget.core.v2_5_0.GroupBox = function () {
    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.GroupBox, Toronto.framework.DefaultWidgetImpl, {
        
        /**
        * Implements Widget.startup.
        * 
        * Retrieves references to this widget's DOM elements and attached DOM events.
        * 
        * @method startup
        * @param widgetContext {WidgetContext}
        */
        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.GroupBox.superclass.startup.apply(this, arguments);
            this.getWidgetContext().getSystem().onUnload.bindHandler(this._cleanup, this);
        },
                      
        _cleanup: function () {
            this._cachedStyledElements = null;
        },
          
        /**
         * Implements optional Widget.getContentElement
         */
        getContentElement: function() {
            return this.getNamedElement("content");
        },
        
        getStyledElements: function () {
            return Toronto.util.CssUtils.getChildElements(this.getContainerElement(), this._getChildElement, this);
        },
	
        _getChildElement : function (element) {
            var id = this.getWidgetID();
            if (!YAHOO.lang.isUndefined(element.id) && element.id !== "" && !element.id.contains(id)) {
                return -1;
            } else if (!YAHOO.lang.isUndefined(element.className) && element.className.matches(/^group-box.*/)) {
                return 1;
            } else {
                return 0;
            }
        }
    });

    YAHOO.lang.augmentProto(Toronto.widget.core.v2_5_0.GroupBox, Toronto.util.CssUtils);
})();