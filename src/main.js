import {
    bootstrapCameraKit,
    createMediaStreamSource,
    Transform2D,
    Injectable,
    RemoteApiService,
    RemoteApiServices,
    RemoteApiRequest,
    RemoteApiRequestHandler,
    RemoteApiStatus,
    remoteApiServicesFactory,

} from '@snap/camera-kit';


(async function () {

    //FORM
    function closeStart() {
        document.getElementById("card-start-content").style.display = "none";
        document.getElementById("card-form").style.display = "flex";
    }
    const form = document.getElementById("myForm");
    form.addEventListener("submit", function (event) {
        // Prevent the default form submission behavior
        event.preventDefault();
        // Your custom logic when the form is submitted
        console.log("Form submitted!");
        document.getElementById("card-start").style.display = "none";
        // You can access form data using form elements, for example:
        const formData = new FormData(form);
        const formDataObject = {};
        formData.forEach(function (value, key) {
            formDataObject[key] = value;
        });
        console.log("Form Data as JSON:", formDataObject);
        sendData(formDataObject);
    });
    //

    async function sendData(obj) {
        let response = await postContact(obj);
        console.log('youston ' + response.message + " : " + response.mail);
    }
    
    async function postContact(obj) {
        return new Promise(async (resolve, reject) => {
            let res = await fetch('https://bouygues-404412.lm.r.appspot.com/contact?' + new URLSearchParams({
                email: obj.email,
                fistname: obj.firstname,
                lastname: obj.lastname,
                phone: obj.phone,
                condition: obj.condition,
            }), {
                method: 'POST',
            })
            let obj = await res.json(); // { mail : 'a@a.com', message: 'Contact added'}
            resolve(obj)
        })
    }












    const damsService = {
        apiSpecId: '87e3aee3-0a82-4fbd-8d71-b4534c79704c',
        getRequestHandler(request) {
            if (request.endpointId !== 'prize') return;

            return async (reply) => {
                const res = await fetch(`https://bouygues-404412.lm.r.appspot.com/prize?mail=${request.parameters.mail}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                const text = await res.text();

                reply({
                    status: 'success',
                    metadata: {},
                    body: new TextEncoder().encode(text)
                });

                const obj = JSON.parse(text);
                console.log('CODE : ' + obj.code);
                carton(obj.mail, obj.code)
            };
        }
    };


    function carton(mail, code) {
        document.getElementById("mail").textContent = mail;
        document.getElementById("code").textContent = code;
        document.getElementById('card-container').style.display = 'flex';
    }


    //var cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNjk4NDEyNDI1LCJzdWIiOiIxMzk1NDk4MC1hYjQwLTQwMTAtYThhZi02NmI5NWYyM2RlYmR-U1RBR0lOR34xOTcxMTQ2OC1jZTY3LTQ5OTgtYmQ5ZS0xNzAwNTRkYTk5NzgifQ.WzqacKQZQIh5SUMC7V45ndhVsk8jjI3BxiwhQVetkz4' })

    //V2 working here
    // var cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNjk4NDEyNDI1LCJzdWIiOiIxMzk1NDk4MC1hYjQwLTQwMTAtYThhZi02NmI5NWYyM2RlYmR-U1RBR0lOR34xOTcxMTQ2OC1jZTY3LTQ5OTgtYmQ5ZS0xNzAwNTRkYTk5NzgifQ.WzqacKQZQIh5SUMC7V45ndhVsk8jjI3BxiwhQVetkz4' }, (container) =>
    var cameraKit = await bootstrapCameraKit({ apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNjk4NDEyNDI1LCJzdWIiOiIxMzk1NDk4MC1hYjQwLTQwMTAtYThhZi02NmI5NWYyM2RlYmR-UFJPRFVDVElPTn4xN2IzNWUzZC1iZWYwLTQxNzUtYTA2Ny05NTNiYmIyOGYyNTQifQ.tqyXjMntFKLnubtZailODeASvccrQziURDt1shDsznE' }, (container) =>
        container.provides(
            Injectable(
                remoteApiServicesFactory.token,
                [remoteApiServicesFactory.token],
                (existing) => [...existing, damsService]
            )
        )
    );




    const session = await cameraKit.createSession();
    let canvas = document.getElementById('canvas');
    canvas.replaceWith(session.output.live);


    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['19bedafd-5ca3-4431-898d-002694113ffe']);
    session.applyLens(lenses[0], { mail: "launch@param.com" });
    // let mediaStream = await navigator.mediaDevices(getUserMedia({ video: true }));
    let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: 'environment'
        }
    });
    const source = createMediaStreamSource(mediaStream, {
        // transform: Transform2D.MirrorX,
        fpsLimit: 30,
        cameraType: 'back',
    });
    await session.setSource(source)
    session.setSource(source)
    session.source.setRenderSize(window.innerWidth, window.innerHeight)
    session.play();

    // canvas = document.querySelector('canvas');
    let ctx = canvas.getContext('webgl2');
    console.log(ctx);
    var rgba;
    var out;
    setInterval(() => {
        ctx = canvas.getContext('webgl2');
        out = new Uint8Array(4);
        ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, out);
        console.log('result');
        console.log(out);

    }, 1000)


})();