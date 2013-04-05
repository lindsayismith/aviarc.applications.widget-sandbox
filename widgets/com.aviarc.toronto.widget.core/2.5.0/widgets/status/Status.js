/*global
YAHOO
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    Toronto.widget.core.v2_5_0.Status = function () {};

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Status, Toronto.framework.DefaultWidgetImpl, {
        
        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.Status.superclass.startup.apply(this, arguments);
           
            var ajaxCount = 0;
            var system = Toronto.client.GlobalState.getTopLevelSystem();

            system.onAjaxRequestStarted.bindHandler(function () {
                ajaxCount += 1;
                if (ajaxCount === 1) {
                    this.show();
                }
            }, this);
            system.onAjaxRequestCompleted.bindHandler(function () {
                ajaxCount -= 1;
                if (ajaxCount === 0) {
                    this.hide();
                }
            }, this);
        }        
    });
    
})();