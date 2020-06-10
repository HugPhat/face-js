class App extends React.Component {
    // reference to both the video and canvas
    videoRef = React.createRef();
    canvasRef = React.createRef();

    // we are gonna use inline style
    styles = {
        position: 'fixed',
        top: 150,
        left: 150,
    };


    detectFromVideoFrame = (model, video) => {
        model.detect(video).then(predictions => {
            faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().then((data) => {

                this.showDetections(predictions, data);
            });

            requestAnimationFrame(() => {
                this.detectFromVideoFrame(model, video);
            });

        }, (error) => {
            console.log("Couldn't start the webcam")
            console.error(error)
        });
    };

    showDetections = (predictions, data) => {
        const ctx = this.canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const font = "24px helvetica";
        ctx.font = font;
        ctx.textBaseline = "top";
        var facedetected = 0,
            eyeballsdetected = 0,
            multipleface_detected = 0,
            mobilephone_detected = 0,
            distraction_detected = 0;

        predictions.forEach(prediction => {
            if ((prediction.class) == "cell phone") {

                const x = prediction.bbox[0];
                const y = prediction.bbox[1];
                const width = prediction.bbox[2];
                const height = prediction.bbox[3];

                ctx.strokeStyle = "#2fff00";
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, width, height);
                // Draw the label background.
                ctx.fillStyle = "#2fff00";
                const textWidth = ctx.measureText(prediction.class).width;
                const textHeight = parseInt(font, 10);
                //// draw top left rectangle
                ctx.fillRect(x, y, textWidth + 10, textHeight + 10);
                //// draw bottom left rectangle
                // ctx.fillRect(x, y + height - textHeight, textWidth + 15, textHeight + 10);
                //
                //// Draw the text last to ensure it's on top.
                ctx.fillStyle = "#000000";
                ctx.fillText(prediction.class, x, y);
                mobilephone_detected += 1;
                //ctx.fillText(prediction.score.toFixed(2), x, y + height - textHeight);
            }

        });

        data.forEach(
            face => {
                const Hratio = ctx.canvas.height / face.detection.imageDims.height;
                const Wratio = ctx.canvas.width / face.detection.imageDims.width;

                const xx = (face.detection.box.x * Wratio);
                const yy = (face.detection.box.y * Hratio);
                const xwidth = face.detection.box.width * Wratio;
                const xheight = face.detection.box.height * Hratio;

                const l38eye = face.landmarks.positions[38].y;
                const l42eye = face.landmarks.positions[42].y;

                const l45eye = face.landmarks.positions[45].y;
                const l47eye = face.landmarks.positions[47].y;

                let disR = l42eye - l38eye;
                let disL = l47eye - l45eye;
                if (disR > 3 || disL > 3) {
                    distraction_detected += 1;
                }
                ctx.strokeStyle = "#2fff00";
                ctx.lineWidth = 3;
                ctx.strokeRect(xx, yy, xwidth, xheight);
                ctx.fillStyle = "#2fff00";
                const textWidth = ctx.measureText("Face").width;
                const textHeight = parseInt(font, 10);
                //// draw top left rectangle
                ctx.fillRect(xx, yy, textWidth + 10, textHeight + 10);
                ctx.fillStyle = "#000000";
                ctx.fillText("Face", xx, yy);
                facedetected += 1;
            }
        );
        eyeballsdetected = eyeballsdetected ? 1 : 0;
        facedetected = facedetected ? 1 : 0;
        multipleface_detected = (facedetected > 1) ? 1 : 0;
        var result = {
            "facedetected": facedetected,
            "eyeballsdetected": eyeballsdetected,
            "multipleface_detected": multipleface_detected,
            "mobilephone_detected": mobilephone_detected,
            "distraction_detected": distraction_detected
        };
        console.log(result);
        return result;
    };

    componentDidMount() {
        if (navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia) {
            // define a Promise that'll be used to load the webcam and read its frames
            const webcamPromise = navigator.mediaDevices
                .getUserMedia({
                    video: true,
                    audio: false,
                })
                .then(stream => {
                    // pass the current frame to the window.stream
                    window.stream = stream;
                    // pass the stream to the videoRef
                    this.videoRef.current.srcObject = stream;

                    return new Promise(resolve => {
                        this.videoRef.current.onloadedmetadata = () => {
                            resolve();
                        };
                    });
                }, (error) => {
                    console.log("Couldn't start the webcam")
                    console.error(error)
                });

            // define a Promise that'll be used to load the model
            const loadlModelPromise = cocoSsd.load();
            console.log("promise all");
            // resolve all the Promises
            Promise.all([loadlModelPromise, webcamPromise,
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models')
                ])
                .then(values => {
                    this.detectFromVideoFrame(values[0], this.videoRef.current);
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    // here we are returning the video frame and canvas to draw,
    // so we are in someway drawing our video "on the go"
    render() {
        return ( <
            div >
            <
            video style = { this.styles }
            autoPlay muted ref = { this.videoRef }
            width = "720"
            height = "600" /
            >
            <
            canvas style = { this.styles }
            ref = { this.canvasRef }
            width = "720"
            height = "650" / >
            <
            /div>
        );
    }
}

const domContainer = document.querySelector('#root');
ReactDOM.render(React.createElement(App), domContainer);