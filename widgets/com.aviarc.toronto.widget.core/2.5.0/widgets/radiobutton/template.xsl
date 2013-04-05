<xsl:stylesheet
     version="2"
     xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

     xmlns:aviarc="urn:aviarc:xslt-extension-elements/com.aviarc.framework.toronto.widget.xslt.XSLTExtensionElementFactory"
     xmlns:cssutils="java:com.aviarc.framework.toronto.util.CssUtils"
     xmlns:xsltutils="com.aviarc.framework.toronto.widget.xslt.XSLTUtils"
     
     extension-element-prefixes="aviarc"
     exclude-result-prefixes="aviarc cssutils xsltutils"
     >

    <xsl:template match="radiobutton">
    
        <xsl:variable name="css-prefix"><xsl:value-of select="xsltutils:getWidgetCSSPrefix()"/></xsl:variable>

        <xsl:variable name="invisible-style">
            <xsl:choose>
                <xsl:when test="xsltutils:isFalse(@visible)">display-none</xsl:when>
                <xsl:otherwise></xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        
        <xsl:variable name="group">
            <xsl:choose>
                <xsl:when test="not(@group)">
                    <xsl:value-of select="@selection-field"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="@group"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="enabled">
            <xsl:choose>
                <xsl:when test="xsltutils:isTrue(@enabled)">y</xsl:when>
                <xsl:otherwise>n</xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

       
        <div class="{cssutils:makeClassString(concat($css-prefix, 'radiobutton'), @class)} {$invisible-style}"
             id="{@name}:div"
             title="{@tooltip}">
            <div/> <!--  border element -->
        	<div class="radiobutton-outer">
				<div class="radiobutton-inner">
		            <xsl:choose>
		                <xsl:when test="$enabled='y'">
		                    <input type="radio" id="{@name}:input" name="{$group}"></input>
		                </xsl:when>
		                <xsl:otherwise>
		                    <input type="radio" id="{@name}:input" name="{$group}" disabled="true"></input>
		                </xsl:otherwise>
		            </xsl:choose>
		         </div>
        	</div>
        </div>
    
    </xsl:template>
</xsl:stylesheet>