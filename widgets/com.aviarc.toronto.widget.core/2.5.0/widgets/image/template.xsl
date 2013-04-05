<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="image">
        
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>
        <xsl:variable name="disabled"><xsl:if test="xsltutils:isFalse(@enabled)">disabled</xsl:if></xsl:variable>
        <xsl:variable name="class"><xsl:value-of select="concat(@class, ' ', $disabled)"/></xsl:variable>
       
        <xsl:variable name="invisible-style">
            <xsl:if test="xsltutils:isFalse(@visible)">display-none</xsl:if>
        </xsl:variable>
        
        <xsl:choose>
            <xsl:when test="@url">
                <div name="{@name}:img" id="{@name}:img"
                     title="{@tooltip}" class="{cssutils:makeClassString(concat($css-prefix, 'image'), $class)} {$invisible-style}">
                    <xsl:choose>
                        <xsl:when test="string-length(normalize-space(@url))=0">
                            <table border="1" cellpadding="0" cellspacing="0" width="100%" height="100%">
                                <tr><td align="center" valign="center"><b>No Image</b></td></tr>
                            </table>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:choose>
                                <xsl:when test="starts-with(@url,'http:') or starts-with(@url,'https')">
                                    <!-- absolute path -->
                                    <img src="{@url}" width="{@width}px" height="{@height}px"/>
                                </xsl:when>
                                <xsl:when test="starts-with(@url,'www/')">
                                    <!-- URLs starting 'www/': add our versioning/URL-workflow prefix; this already ends 'www/' so drop the duplicate 4 chars -->
                                    <img src="{xsltutils:getWWWURLPrefix()}{substring(@url,5)}" width="{@width}px" height="{@height}px"/>
                                </xsl:when>
                                <!-- Unexpected prefix - may still work if it matches one of the controller patterns, allow it -->
                                <xsl:otherwise>
                                    <img src="{@url}" width="{@width}px" height="{@height}px"/>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>
            </xsl:when>
            <!-- otherwise assume theme case -->
            <xsl:otherwise>
                <div name="{@name}:img" id="{@name}:img"
                     title="{@tooltip}" class="{cssutils:makeClassString(concat($css-prefix, 'image'), $class)}"></div>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
    
</xsl:stylesheet>