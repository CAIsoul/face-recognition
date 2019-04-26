$(".upload").on("click", function()
{
	var fileName = $('input[name=filename]').val();
	if (fileName.trim().length === 0)
	{
		alert("Name is required!");
		$('input[name=filename]').focus();
		return;
	}

	var formData = generateFormData();

	$.ajax({
		type: "POST",
		url: "/image",
		data: formData,
		processData: false,
		contentType: false,
		success: function(data)
		{
			console.log(data);
		},
		error: function(e)
		{
			console.log(e);
		}
	});
});

function generateFormData()
{
	var uploadType = $("input[name=uploadType]:checked")[0].value;
	if (uploadType === "localimage")
	{
		return new FormData($(".file-form")[0]);
	}
	else if (uploadType === "camera")
	{
		var image = $('#imgScreenshot').attr('src');
		var base64ImageContent = image.replace(/^data:image\/(png|jpg);base64,/, "");
		var blob = base64ToBlob(base64ImageContent, 'image/png');
		var formData = new FormData();
		formData.append('filename', $('input[name=filename]').val());
		formData.append('file', blob);

		return formData;
	}
}

function base64ToBlob(base64, mime) 
{
	mime = mime || '';
	var sliceSize = 1024;
	var byteChars = window.atob(base64);
	var byteArrays = [];

	for (var offset = 0, len = byteChars.length; offset < len; offset += sliceSize)
	{
		var slice = byteChars.slice(offset, offset + sliceSize);

		var byteNumbers = new Array(slice.length);
		for (var i = 0; i < slice.length; i++)
		{
			byteNumbers[i] = slice.charCodeAt(i);
		}

		var byteArray = new Uint8Array(byteNumbers);

		byteArrays.push(byteArray);
	}

	return new Blob(byteArrays, { type: mime });
}