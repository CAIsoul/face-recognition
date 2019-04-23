const express = require('express'),
	path = require('path'),
	{ get } = require('request'),
	fs = require("fs"),
	multer = require("multer"),
	app = express(),
	crypto = require('crypto'),
	http = require("http"),
	https = require("https");

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, '../media')))
app.use(express.static(path.join(__dirname, '../../weights')))
app.use(express.static(path.join(__dirname, '../../dist')))

var credentials = null;
fs.stat(__dirname + '/public/certificates/privatekey.pem', function(err, stat)
{
	if (stat && stat.isFile())
	{
		var privateKey = fs.readFileSync(__dirname + '/public/certificates/privatekey.pem').toString(),
			certificate = fs.readFileSync(__dirname + '/public/certificates/certificate.pem').toString();

		credentials = {key: privateKey, cert: certificate};

		startHttps();
	}
	else
	{
		startHttp();
	}
});

app.get('/', (req, res) => res.redirect('/student'))
app.get('/student', (req, res) => res.sendFile(path.join(viewsDir, 'student.html')))
app.get('/upload', (req, res) => res.sendFile(path.join(viewsDir, 'upload.html')))
app.get('/face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceDetection.html')))
app.get('/face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceLandmarkDetection.html')))
app.get('/face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceExpressionRecognition.html')))
app.get('/face_extraction', (req, res) => res.sendFile(path.join(viewsDir, 'faceExtraction.html')))
app.get('/face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceRecognition.html')))
app.get('/video_face_tracking', (req, res) => res.sendFile(path.join(viewsDir, 'videoFaceTracking.html')))
app.get('/webcam_face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceDetection.html')))
app.get('/webcam_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceLandmarkDetection.html')))
app.get('/webcam_face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceExpressionRecognition.html')))
app.get('/bbt_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceLandmarkDetection.html')))
app.get('/bbt_face_similarity', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceSimilarity.html')))
app.get('/bbt_face_matching', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceMatching.html')))
app.get('/bbt_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceRecognition.html')))
app.get('/batch_face_landmarks', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceLandmarks.html')))
app.get('/batch_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceRecognition.html')))

// app.post('/fetch_external_image', async (req, res) =>
// {
// 	const { imageUrl } = req.body
// 	if (!imageUrl)
// 	{
// 		return res.status(400).send('imageUrl param required')
// 	}
// 	try
// 	{
// 		const externalResponse = await request(imageUrl)
// 		res.set('content-type', externalResponse.headers['content-type'])
// 		return res.status(202).send(Buffer.from(externalResponse.body))
// 	} catch (err)
// 	{
// 		return res.status(404).send(err.toString())
// 	}
// })

app.get('/getImageList', (req, res) =>
{
	let imgList = getImageList();
	res.send(JSON.stringify(imgList));
});

// 通过 filename 属性定制
var storage = multer.diskStorage({
	destination: __dirname,
	filename: function(req, file, cb)
	{
		// 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
		cb(null, req.body.filename + '.png');
	}
});

// 通过 storage 选项来对 上传行为 进行定制化
var upload = multer({ storage: storage })

app.post('/image', upload.single('file'), function(req, res, next)
{
	var file = req.file;

	console.log('文件类型：%s', file.mimetype);
	console.log('原始文件名：%s', file.originalname);
	console.log('文件大小：%s', file.size);
	console.log('文件保存路径：%s', file.path);
	res.send('a');
});

// app.get('/form', function(req, res, next){
//     var form = fs.readFileSync('./form.html', {encoding: 'utf8'});
//     res.send(form);
// });

//app.listen(3000, () => console.log('Listening on port 3000!'));

function startHttp()
{
	var server = http.createServer(app);
	server.listen(3000);
	console.log("http server start, listening on port 3000!");
}

function startHttps()
{
	var httpsServer = https.createServer(credentials, app);
	httpsServer.listen(8443);
	console.log("https server start, listening on port 8443!");
}

function getImageList()
{
	let imgFolderPath = path.join(viewsDir, 'images/studentphotos');
	let dirList = fs.readdirSync(imgFolderPath);

	return dirList.map(function(imgFileName)
	{
		return {
			name: imgFileName.split('.')[0],
			path: 'images/studentphotos/' + imgFileName
		}
	});
}

//function request(url, returnBuffer = true, timeout = 10000)
//{
//	return new Promise(function(resolve, reject)
//	{
//		const options = Object.assign(
//			{},
//			{
//				url,
//				isBuffer: true,
//				timeout,
//				headers: {
//					'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
//				}
//			},
//			returnBuffer ? { encoding: null } : {}
//		)

//		get(options, function(err, res)
//		{
//			if (err) return reject(err)
//			return resolve(res)
//		})
//	})
//}

//function readAllImages()
//{
//	let path = '.root';
//	let dirList = fs.readdirSync(path);
//	console.log(dirList);
//	//fs.readFile('../file.txt', function(err, data)
//	//{
//	//	if (err)
//	//	{
//	//		console.log("bad")
//	//	} else
//	//	{
//	//		console.log("ok");
//	//		console.log(data);
//	//		console.log(data.toString());
//	//	}
//	//})
//}
