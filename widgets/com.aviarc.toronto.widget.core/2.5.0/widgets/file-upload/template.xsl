<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="file-upload">
        
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        <xsl:variable name="mandatory"><xsl:if test="xsltutils:isTrue(@mandatory)">mandatory</xsl:if></xsl:variable>

        <xsl:variable name="displaystyle">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@visible)">inline</xsl:when>
                <xsl:otherwise>none</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="disabled-class">
            <xsl:if test="xsltutils:isFalse(@enabled)">disabled</xsl:if>
        </xsl:variable>
        
        <xsl:variable name="disabled">
            <xsl:if test="xsltutils:isFalse(@enabled)">true</xsl:if>
        </xsl:variable>

        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $mandatory, ' ', $disabled-class)"/></xsl:variable>
        
        <div name="{@name}:div" id="{@name}:div" class="{cssutils:makeClassString(concat($css-prefix, 'file-upload'), $class)}" style="position:absolute; left:{@x}px;top:{@y}px; display: {$displaystyle}" title="{@tooltip}">
            <input title="{@tooltip}" type="file" name="{@name}" id="{@name}" class="{cssutils:makeClassString(concat($css-prefix, 'file-upload'), $class)}" size="{@size}">
                <!-- disabled state set in JS now -->
            </input>
        </div>
    </xsl:template>
</xsl:stylesheet>