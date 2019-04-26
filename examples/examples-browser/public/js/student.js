let forwardTimes = []

function updateTimeStats(timeInMs)
{
	forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30)
	const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length
	$('#time').val(`${Math.round(avgTimeInMs)} ms`)
	$('#fps').val(`${faceapi.round(1000 / avgTimeInMs)}`)
}

async function onPlay()
{
	const videoEl = $('#inputVideo').get(0)

	if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
		return setTimeout(() => onPlay())


	const options = getFaceDetectorOptions()

	const ts = Date.now()

	const result = await faceapi.detectSingleFace(videoEl, options)

	updateTimeStats(Date.now() - ts)

	if (result)
	{
		drawDetections(videoEl, $(".camera-canvas")[0], [result])
	}

	setTimeout(() => onPlay(), 1000)
}

//var faceMatcher=[];
var faceMatcher;
async function run()
{
	showLoadingIndicator("Loading face recognition Models...");

	await loadStudentImages();
	// load face detection model
	await changeFaceDetector(SSD_MOBILENETV1)
	changeInputSize(512)

	await faceapi.loadFaceLandmarkModel('/');
	await faceapi.loadFaceRecognitionModel('/');

	await loadFaceMatcher();

	$('.open-camera').on('click', function() { openCamera(); });
	initLoginOptions();

	hideLoadingIndicator();
}

function initLoginOptions()
{
	$(".login-tab").on("click", function(e)
	{
		var $target = $(e.target);
		if ($target.hasClass("active")) return;

		$(".login-tab").removeClass("active");
		$target.addClass("active");
		if ($target.hasClass("face-recognition-login"))
		{
			$(".classic-login").hide();
			$(".video-container").show();
			openCamera();
		}
		else
		{
			$(".classic-login").show();
			$(".video-container").hide();
			closeCamera();
		}
	});
}

async function loadStudentImages()
{
	return $.ajax({
		url: '/getImageList',
		type: 'GET',
		success: function(response)
		{
			var imgObjects = JSON.parse(response),
				$container = $('.ref-images-container'),
				$ul = $('<ul>');

			$container.empty();
			imgObjects.forEach(function(imgObject)
			{
				var li = $('<li>'),
					textDiv = $('<div class="name">' + imgObject.name + '</div>');

				li.append(textDiv);
				li.append($("<img class='imgRef' src='" + imgObject.path + "'>"));
				$ul.append(li);
			});

			$container.append($ul);
		},
		error: function()
		{

		}
	});
}

var mediaStreamTrack;
async function openCamera()
{
	// try to access users webcam and stream the images
	// to the video element
	const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
	const videoEl = $('#inputVideo')[0];
	videoEl.srcObject = stream;
	mediaStreamTrack = stream.getTracks()[0];
}

function closeCamera()
{
	if (!mediaStreamTrack) return;

	mediaStreamTrack.stop();
}

async function asyncForEach(array, callback)
{
	for (let index = 0; index < array.length; index++)
	{
		await callback(array[index], index, array);
	}
}

async function loadFaceMatcher()
{
	var detectorOption = getFaceDetectorOptions();
	var images = $(".ref-images-container img").map(function() { return arguments[1] }),
		descriptors = [],
		nameArray = [];

	if (images.length == 0) return;

	await asyncForEach(images, async (image) =>
	{
		var descriptor = await faceapi
			.detectSingleFace(image, detectorOption)
			.withFaceLandmarks()
			.withFaceDescriptor();

		nameArray.push($(image).closest("li").find(".name").text());
		descriptors.push(descriptor);
	});

	faceMatcher = await new faceapi.FaceMatcher(descriptors);
	for (var i = 0; i < faceMatcher.labeledDescriptors.length; i++)
	{
		faceMatcher.labeledDescriptors[i]._label = nameArray[i];
	}
}

function updateResults() { }

$(document).ready(function()
{
	//renderNavBar('#navbar', 'webcam_face_detection')
	initFaceDetectionControls()
	run()
})

function screenshot()
{
	var canvas = document.getElementById('canvasScreenshot'),
		video = $('#inputVideo').get(0),
		img = $('#imgScreenshot').get(0);
	//绘制canvas图形
	canvas.getContext('2d').drawImage(video, 0, 0, 400, 300);


	//把canvas图像转为img图片
	img.src = canvas.toDataURL("image/png");
}

var queryDescriptions;
async function compare()
{
	var input = $('#imgScreenshot').get(0);
	var imageData =
		queryDescriptions = await faceapi
			.detectAllFaces(input, getFaceDetectorOptions())
			.withFaceLandmarks()
			.withFaceDescriptors();

	await updateReferenceImageResults();
}

var finishRecognition;
var recognizedNames = [];
async function updateReferenceImageResults()
{
	var canvas = $(".camera-canvas")[0],
		img = $('#imgScreenshot').get(0);

	if (faceMatcher == null) return;

	// resize detection and landmarks in case displayed image is smaller than
	// original size
	resizedResults = resizeCanvasAndResults(img, canvas, queryDescriptions)
	// draw boxes with the corresponding label as text
	const boxesWithText = resizedResults.map(({ detection, descriptor }) =>
		new faceapi.BoxWithText(
			detection.box,
			// match each face descriptor to the reference descriptor
			// with lowest euclidean distance and display the result as text
			faceMatcher.findBestMatch(descriptor).label
		)
	)

	//faceapi.drawDetection(canvas, boxesWithText);
	if (!boxesWithText ||
		!boxesWithText[0] ||
		!boxesWithText[0]._text ||
		boxesWithText[0]._text === "unknown")
		return;

	var name = boxesWithText[0]._text;
	if (recognizedNames.indexOf(name) >= 0) return;

	hello(name);
	recognizedNames.push(name);
	//closeCamera();
	//if (!finishRecognition)
	//{
	//	showVerificationResultModal("Hello " + boxesWithText[0]._text);
	//	finishRecognition = true;
	//}
}

function showVerificationResultModal(text)
{
	var $modalContainer = $(".modal-container"),
		$modalDialog = $modalContainer.find(".modal-dialog"),
		dialogWidth = $modalDialog.width(),
		dialogHeight = $modalDialog.height(),
		screenWidth = window.screen.width,
		screenHeight = window.screen.height;

	var top = screenHeight / 2 - dialogHeight / 2;
	var left = screenWidth / 2 - dialogWidth / 2;
	$modalDialog.css("top", top);
	$modalDialog.css("left", left);

	$modalDialog.find(".modal-title").text("Confirmation Message");
	$modalDialog.find(".modal-body").html(
		`<div class="bootbox-body">
			<pre class="titleNotify">${text}</pre>
		</div>`);

	$modalContainer.show();
}

function hideModal()
{
	$(".modal-container").hide();
}

function openSettingModal()
{
	var $modalContainer = $(".modal-container"),
		createUserItem = function(obj)
		{
			return `
				<div class="user-item">
					<img class="user-pic" src="${obj.path}">
					<span class="user-name">${obj.name}</span>
				</div>`;
		};

	$modalContainer.find(".modal-title").text("Manage Users");
	$modalContainer.find(".modal-body").html(`
		<div class="user-container"><div>
	`);

	getUseImageList().then(function(userList)
	{
		userList.map(function(user)
		{
			$modalContainer.find(".user-container").append(createUserItem(user));
		});

		$modalContainer.show();
	});
}

function getUseImageList()
{
	return new Promise(function(resolve, reject)
	{
		$.ajax({
			url: '/getImageList',
			type: 'GET',
			success: function(response)
			{
				var imgObjects = JSON.parse(response);
				resolve(imgObjects);
			},
			error: function(error)
			{
				reject(error);
			}
		})
	});
}

function showLoadingIndicator(text)
{
	var loadingText = text || "Loading...";
	$("#loadingindicator .subtitle-text").text(loadingText);
	$("#loadingindicator").show();
}

function hideLoadingIndicator()
{
	$("#loadingindicator").hide();
}

toastr.options = {
	"closeButton": false,
	"debug": false,
	"newestOnTop": false,
	"progressBar": false,
	"positionClass": "toast-bottom-full-width",
	"preventDuplicates": false,
	"onclick": null,
	"showDuration": "300",
	"hideDuration": "1000",
	"timeOut": "3000",
	"extendedTimeOut": "1000",
	"showEasing": "swing",
	"hideEasing": "linear",
	"showMethod": "fadeIn",
	"hideMethod": "fadeOut"
}

function hello(name)
{
	toastr.success("Hello " + name + "!");
}

async function reloadImageSamples()
{
	showLoadingIndicator("Loading image samples...");

	await loadStudentImages();
	await loadFaceMatcher();

	hideLoadingIndicator();
}