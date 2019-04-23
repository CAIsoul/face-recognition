$(".upload").on("click",function()
{
	var formData = new FormData($(".file-form")[0]);

	$.ajax({  
		type: "POST", 
		url: "/image",
		data: formData,
		processData: false,
		contentType: false,
		success: function(data){  
					console.log(data);
				 },
		error:function(e){  
					console.log(e);  
		}  
	});
});