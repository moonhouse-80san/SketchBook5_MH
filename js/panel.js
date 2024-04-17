jQuery(document).ready(function($){
	$(".sk_flip").toggle(function(){
	$(".sk_panel").fadeIn(500);
	},function(){
	$(".sk_panel").toggle()
	});
});