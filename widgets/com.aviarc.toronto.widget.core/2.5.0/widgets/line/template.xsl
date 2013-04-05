<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="line">
    
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>

        <xsl:variable name="invisible-style">
            <xsl:choose>
                <xsl:when test="xsltutils:isFalse(@visible)">display-none</xsl:when>
                <xsl:otherwise></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="left">
            <xsl:if test="@left != ''">left:<xsl:value-of select="@left"/>px;</xsl:if>
        </xsl:variable>
        <xsl:variable name="right">
            <xsl:if test="@right != ''">right:<xsl:value-of select="@right"/>px;</xsl:if>
        </xsl:variable>
        <xsl:variable name="top">
            <xsl:if test="@top != ''">top:<xsl:value-of select="@top"/>px;</xsl:if>
        </xsl:variable>
        <xsl:variable name="bottom">
            <xsl:if test="@bottom != ''">bottom:<xsl:value-of select="@bottom"/>px;</xsl:if>
        </xsl:variable>
        
        <xsl:variable name="height">
            <xsl:if test="@height != ''">height:<xsl:value-of select="@height"/>px;</xsl:if>
        </xsl:variable>
        
        <xsl:variable name="width">
            <xsl:if test="@width != ''">width:<xsl:value-of select="@width"/>px;</xsl:if>
        </xsl:variable>
        
        <div class="{cssutils:makeClassString(concat($css-prefix, 'line'), @class)} {$invisible-style}"
             id="{@name}:div" style="{$left} {$top} {$right} {$bottom} position: absolute; {$height} {$width}">
        </div>
    
    </xsl:template>
</xsl:stylesheet>