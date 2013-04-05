<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="status">
        
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>

        <div id="{@name}:div" class="{cssutils:makeClassString(concat($css-prefix, 'status'), @class)} display-none" title="{@tooltip}">
            <xsl:value-of select="@text"/>
        </div>
    </xsl:template>
    
 </xsl:stylesheet>