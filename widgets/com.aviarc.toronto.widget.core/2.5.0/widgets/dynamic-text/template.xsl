<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"

     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="dynamic-text">
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>

        <xsl:variable name="classlist">
            <xsl:value-of select="cssutils:makeClassString(concat($css-prefix, 'dynamic-text'), @class)"/>
        </xsl:variable>

        <xsl:variable name="invisible-style">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>

        <div id="{@name}:div" class="{$classlist} {$invisible-style}">
        </div>
    </xsl:template>

</xsl:stylesheet>