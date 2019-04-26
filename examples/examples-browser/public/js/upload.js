notOpenCamera = true;

$(".upload").on("click", function()
{
	var personName = $(".name-container input").val();
	if (personName.trim().length === 0)
	{
		alert("Name is required!");
		$(".name-container input").focus();
		return;
	}

	$('input[name=filename]').val(personName);

	var formData = generateFormData();

	$.ajax({
		type: "POST",
		url: "/image",
		data: formData,
		processData: false,
		contentType: false,
		success: function(data)
		{
			toastr.success("Upload successfully!");
		},
		error: function(e)
		{
			toastr.error("Upload failed!");
		}
	});
});

$(".upload-options input").on("change", function(e)
{
	var showCameraContainer = e.target.value === "camera";
	if (showCameraContainer)
	{
		$(".local-image-container").hide();
		$(".camera-image-container").show();
		openCamera();
	}
	else
	{
		$(".local-image-container").show();
		$(".camera-image-container").hide();
		closeCamera();
	}
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

function showSelectedImage()
{
	/// get select files.
	var selectFiles = $(".local-image-container input[type=file]")[0].files;

	for (var file of selectFiles)
	{
		console.log(file.webkitRelativePath);
		/// read file content.
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onloadend = function()
		{
			$(".image-selected")[0].src = this.result;
		}
	}
}