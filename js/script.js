(function ($, root, undefined) {

	$.getJSON( "../datos.json", function( data ) {
		console.log(data);
		$('#info').html('Hay <b>' + data.length + '</b> mensajes recibidos');

		for(var i = data.length - 1; i >= 0; i--) {
			var $elem = $('<li></li>');
			var date = new Date(data[i].date*1000);
			var day = date.getDate();
			var monthIndex = date.getMonth() + 1;
			var year = date.getFullYear();

			var h = addZero(date.getHours());
			var m = addZero(date.getMinutes());
			var s = addZero(date.getSeconds());

			var strDate = day + '/' + monthIndex + '/' + year + ' ' + h + ':' + m + ':' + s;

			var out = strDate + ' > enviado por <b>' + data[i].from_name + '</b>';
			if(data[i].type == 'texto')
				out += ': <em>'+data[i].file+'</em>'
			else{
				out += ': <a href="'+data[i].file+'">archivo</a>'
			}
			$elem.html(out);
			$('#content').append($elem)
		}
	});

	function addZero(i) {
		if (i < 10) {
		  i = "0" + i;
		}
		return i;
	  }

})(jQuery, this);