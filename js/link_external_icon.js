// Copyright 2010 htmldrive.net Inc.
/**
 * @projectHomepage http://www.htmldrive.net/go/to/link-external-icon
 * @projectDescription Show external link icon
 * @author htmldrive.net
 * More script and css style : htmldrive.net
 * @version 1.0
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */
(function(a){
    a.fn.link_external_icon=function(p){
        var p=p||{};
        var icon_path=p&&p.icon_path?p.icon_path:"link_external.png";
        var n=a(this);
        n.find("a[target='_blank']").css("padding-right","18px").css("background-image","url("+icon_path+")").css("background-repeat","no-repeat").css("background-position","center right");
    }
})(jQuery);