import {useEffect, useRef, useState} from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import SceneInit from './lib/SceneInit';
import './App.css'
import {translations} from "./translations.js";
import * as THREE from "three";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { gsap } from 'gsap';
import {FontLoader} from "three/examples/jsm/loaders/FontLoader";
import {TTFLoader} from "three/examples/jsm/loaders/TTFLoader.js";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import emailjs from 'emailjs-com';

function App() {
    const [activeModal, setActiveModal] = useState(null);
    const audioRef = useRef(null);
    const audioCtxRef = useRef(null);
    const sourceRef = useRef(null);
    const [language, setLanguage] = useState('en');
    const [isClickable, setIsClickable] = useState(false);
    const t = translations[language];
    const sceneInitRef = useRef(null);
    const carModelRef = useRef(null);
    const [animationStarted, setAnimationStarted] = useState(false);
    const leftFlareRef = useRef(null);
    const rightFlareRef = useRef(null);
    const [showIntro, setShowIntro] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const lightUpRef = useRef(null);
    const audioPlayedRef = useRef(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuButtonsRef = useRef([]);
    const backgroundTexture = useRef(null);
    const [customService, setCustomService] = useState('');
    const [startConfirmed, setStartConfirmed] = useState(false);
    const textMeshesRef = useRef([]); // Сюда будем сохранять 3D-тексты
    const [isPlayingInto, setPlayingIntro] = useState(true);

    const [preselectedServices, setPreselectedServices] = useState([]);
    const [buttonLabels, setButtonLabels] = useState([]);
    const services = t.services;
    const [selected, setSelected] = useState([]);
    const toggle = (index) => {
        setSelected(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };
    const total = selected.reduce((sum, i) => sum + services[i].price, 0);
    function createLensFlare(x) {
        const textureLoader = new THREE.TextureLoader();
        const textureFlare0 = textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare0.png');
        const textureFlare3 = textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare3.png');

        // Создаем Lensflare
        const lensflare = new Lensflare();
        lensflare.addElement(new LensflareElement(textureFlare0, 512, 0, new THREE.Color(0.7, 0.8, 1))); // Ближе к синему
        lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.3, new THREE.Color(0.4, 0.6, 1))); // Более синий
        lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6, new THREE.Color(0.2, 0.4, 1)));  // Почти чистый синий
        lensflare.visible = false;
     
        const light = new THREE.SpotLight(0x6699ff, 5);
        light.position.set(x, 35, 205);
        light.add(lensflare);


        return { light, lensflare };
    }
    
    const modalRefs = {
        about: useRef(null),
        map: useRef(null),
        booking: useRef(null)
    };
    const openModal = (modalName) => {
        setActiveModal(modalName);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (activeModal === 'priceList') setSelected([]);
        setActiveModal(null);
        document.body.style.overflow = 'auto';
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event) => {
        if (!sceneInitRef.current) return;

        const rect = sceneInitRef.current.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneInitRef.current.camera);

        const allHoverables = [...textMeshesRef.current];

        sceneInitRef.current.scene.traverse(obj => {
            if (obj.name === 'hoodButton' || obj.name === 'instagramCube') {
                allHoverables.push(obj);
            }
        });

        const intersects = raycaster.intersectObjects(allHoverables, true);
        
        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    };

    const handleModelClick = (event) => {
        if (!sceneInitRef.current ) return;

        const rect = sceneInitRef.current.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, sceneInitRef.current.camera);

        const allClickable = [...menuButtonsRef.current];

        sceneInitRef.current.scene.traverse(obj => {
            if (obj.name === 'hoodButton' || obj.name === 'instagramCube') {
                allClickable.push(obj);
            }
        });

        const intersects = raycaster.intersectObjects(allClickable, true);

        if (intersects.length > 0) {
            const clicked = intersects[0].object;
            if (clicked.userData.link) {
                window.open(clicked.userData.link, '_blank');
                return;
            }
            if (clicked.userData.modal) {
                openModal(clicked.userData.modal);
            }
        }
    };

    
    
    useEffect(() => {
        const currentLabels = [
            {
                label: t.aboutBtn,
                modal: 'about',
                position: new THREE.Vector3(0, -50, 330),
                rotation: new THREE.Euler(0, 0, 0),
                size: 70
            },
            {
                label: t.mapBtn,
                modal: 'map',
                position: new THREE.Vector3(-180, -50, 0),
                rotation: new THREE.Euler(0, -Math.PI / 2, 0),
                size: 70
            },
            {
                label: t.bookingBtn,
                modal: 'booking',
                position: new THREE.Vector3(180, -50, 0),
                rotation: new THREE.Euler(0, Math.PI / 2, 0),
                size: 70
            },
            // {
            //     label: t.priceList,
            //     modal: 'priceList',
            //     position: new THREE.Vector3(0, -50, -400),
            //     rotation: new THREE.Euler(0, 0, 0),
            //     size: 70
            // }
        ];
        const loader = new THREE.TextureLoader();
        loader.load('/texture.png', (texture) => {
            backgroundTexture.current = texture;
            const test = new SceneInit('myThreeJsCanvas');
            sceneInitRef.current = test;

            test.initialize(texture);
            test.animate();
            test.addInstagramCubeWithLink();

            const menuButtons = [];
            const fontLoader = new FontLoader();
            const fontPath = language === 'ru'
                ? '/fonts/Tektur_Regular.json'
                : '/fonts/Iceland_Regular.json';
            fontLoader.load(fontPath, font => {
                // Удаляем старые текстовые объекты
                textMeshesRef.current.forEach(mesh => {
                    sceneInitRef.current.scene.remove(mesh);
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                });

                const newMeshes = currentLabels.map(({label, modal, position, rotation, size}) => {
                    const textGeometry = new TextGeometry(label, {
                        font,
                        size,
                        height: 2
                    });
                    textGeometry.computeBoundingBox();
                    textGeometry.computeBoundingSphere();
                    textGeometry.center();

                    const textMaterial = new THREE.MeshStandardMaterial({
                        color: 0x000000,
                        roughness: 0.6,
                        metalness: 0.3,
                        emissive: 0x000000,
                        emissiveIntensity: 0.2,
                        envMapIntensity: 1.0,
                    });

                    const mesh = new THREE.Mesh(textGeometry, textMaterial);
                    mesh.position.copy(position);
                    mesh.rotation.copy(rotation);
                    mesh.userData.modal = modal;

                    sceneInitRef.current.scene.add(mesh);
                    return mesh;
                });

                textMeshesRef.current = newMeshes;
                menuButtonsRef.current = newMeshes;

                setTimeout(() => {
                    window.addEventListener('click', handleModelClick);
                    window.addEventListener('touchstart', handleModelClick);
                    window.addEventListener('mousemove', handleMouseMove); // ← ЭТО ДОБАВЬ
                }, 0);
            });


            const {light: leftFlareLight, lensflare: leftFlare} = createLensFlare(77);
            const {light: rightFlareLight, lensflare: rightFlare} = createLensFlare(-80);

            leftFlareRef.current = {light: leftFlareLight, lensflare: leftFlare};
            rightFlareRef.current = {light: rightFlareLight, lensflare: rightFlare};

            test.scene.add(leftFlareLight);
            test.scene.add(rightFlareLight);

            const ambientLight = new THREE.AmbientLight(0xffffff, 5);
            ambientLight.castShadow = false;
            test.scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
            directionalLight.position.set(100, 200, 300);
            directionalLight.castShadow = true;

            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 1000;

            test.scene.add(directionalLight);

            const targetObject = new THREE.Object3D();
            targetObject.position.set(0, 0, 0);
            test.scene.add(targetObject);

            const lightUp = new THREE.SpotLight(0xffffff, 0);
            lightUp.position.set(0, 500, 0);
            lightUp.angle = Math.PI / 3;
            lightUp.distance = 2500;
            lightUp.penumbra = 0.3;
            lightUp.decay = 1;
            lightUp.castShadow = true;

            lightUp.target = targetObject;
            test.scene.add(lightUp);
            lightUpRef.current = lightUp;
            // test.addInstagramCubeWithLink();
            test.scene.add(lightUp);

            let loadedModel;
            const manager = new THREE.LoadingManager();
            manager.onProgress = (url, itemsLoaded, itemsTotal) => {
                const progress = (itemsLoaded / itemsTotal) * 100;
                setLoadingProgress(progress);
            };

            manager.onLoad = () => {
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);// небольшая пауза для UX
            };

            const gltfLoader = new GLTFLoader(manager);
            gltfLoader.load('/vbk.glb', (gltfScene) => {
                const model = gltfScene.scene;
                model.position.set(0, -50, 0); // было (0, 0, 0)
                model.scale.set(2, 2, 2);
                model.rotation.y = 0;
                model.castShadow = false;
                carModelRef.current = model;
                const buttonLight = new THREE.PointLight(0xff0000, 1, 10);
                buttonLight.position.set(0, 56, 96);
                model.add(buttonLight);

                test.scene.add(model);
                sceneInitRef.current.mixer = new THREE.AnimationMixer(model);
                sceneInitRef.current.animationActions = [];

                gltfScene.animations.forEach((clip) => {
                    const action = sceneInitRef.current.mixer.clipAction(clip);
                    action.clampWhenFinished = true;
                    action.loop = THREE.LoopOnce;
                    sceneInitRef.current.animationActions.push(action);
                });
            });

            const canvas = sceneInitRef.current.renderer.domElement;
            canvas.addEventListener('click', handleModelClick);
            canvas.addEventListener('touchstart', handleModelClick);
            canvas.addEventListener('mousemove', handleMouseMove);
            
            return () =>
            {
                window.removeEventListener('click', handleModelClick);
                window.removeEventListener('touchstart', handleModelClick);

                canvas.removeEventListener('click', handleModelClick);
                canvas.removeEventListener('touchstart', handleModelClick);
                canvas.removeEventListener('mousemove', handleMouseMove);
            }
        });
        
    }, [language]);
    
    const handleClick = (shouldPlayMusic) => {
        if (animationStarted) return; // 🔒 если уже запускали, ничего не делаем
        

        // if (shouldPlayMusic && !audioPlayedRef.current) {
        //
        //     const audio = new Audio('./assets/LAAA.mp3');
        //     const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        //     const analyser = audioCtx.createAnalyser();
        //     const source = audioCtx.createMediaElementSource(audio);
        //
        //     audioRef.current = audio;
        //     audioCtxRef.current = audioCtx;
        //     sourceRef.current = source;
        //
        //     source.connect(analyser);
        //     analyser.connect(audioCtx.destination);
        //     if (audioCtx.state === 'suspended') {
        //         audioCtx.resume();
        //     }
        //
        //     audio.play().catch(err => {
        //         console.warn("Playback failed:", err);
        //     });
        //
        //     audioPlayedRef.current = true;
        // }

        // плавно включаем главный свет через 10 сек
        setTimeout(() => {
            gsap.to(lightUpRef.current, { intensity: 4000, duration: 2 });
        }, 5000);

        // включаем боковой свет
        gsap.to(leftFlareRef.current.light, { intensity: 7, duration: 2 });
        gsap.to(rightFlareRef.current.light, { intensity: 7, duration: 2 });

        // включаем lensflare через 17 сек
        setTimeout(() => {
            if (leftFlareRef.current.lensflare) leftFlareRef.current.lensflare.visible = true;
            if (rightFlareRef.current.lensflare) rightFlareRef.current.lensflare.visible = true;
            setPlayingIntro(false);
        }, 4000);

        // запускаем анимацию камеры
        sceneInitRef.current?.startCameraAnimation(() => {
            setIsClickable(true); 
        });
        
    };
    const handleBookingSubmit = (e) => {
        e.preventDefault();

        const form = e.target;
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();
        const date = form.date.value;
        const time = form.time.value;
        const notes = form.notes.value.trim();

        if (!name || !email || !phone || !date || !time || (!preselectedServices.length && !customService)) {
            alert("Please fill all required fields including service.");
            return;
        }

        const formData = {
            name,
            email,
            phone,
            date,
            time,
            notes,
            services: preselectedServices.length > 0 ? preselectedServices.join(', ') : customService
        };

        emailjs.send('service_ni7464l', 'template_4vmnv2v', formData, '6SZyY9TdH8gJ4mx1J')
            .then(() => {
                alert("✅ Email sent!");
                setPreselectedServices([]);
                closeModal();
            }, (error) => {
                alert("❌ Failed to send: " + error.text);
            });
    };


    return (
        <div style={{width: '100vw', height: '100vh'}}>
            {showIntro && (
                <div className="modal-overlay-lang">
                    <div className="modal-content intro-modal">
                        <h2>{t.selectLang}</h2>
                        <div className="language-buttons">
                            <button onClick={() => setLanguage('en')}>EN</button>
                            <button onClick={() => setLanguage('et')}>ET</button>
                            <button onClick={() => setLanguage('ru')}>RU</button>
                        </div>
                        <p style={{marginTop: '1rem'}}>
                            {language === 'ru' ?
                                'Чтобы вращать модель, водите пальцем по верхней части экрана' :
                                language === 'et' ?
                                    'Mudeli keeramiseks liigutage sõrme ülevalt' :
                                    'To rotate the model, swipe at the top of the screen'}
                        </p>
                        <button
                            className="submit-button"
                            style={{marginTop: '1rem'}}
                            onClick={() => {
                                setShowIntro(false);
                                setStartConfirmed(true); // это можешь использовать для UI
                                handleClick(false); // запустить анимацию, музыку и т.д.
                            }}
                        >{t.start}
                        </button>
                    </div>
                </div>
            )}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-bar" style={{width: `${loadingProgress}%`}}></div>
                    <div className="loading-text">{Math.floor(loadingProgress)}%</div>
                </div>
            )}
            
            
            <canvas id="myThreeJsCanvas"/>
            
            {/* About Us Modal */}
            {activeModal === 'about' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content about-modal"
                        onClick={e => e.stopPropagation()}
                        ref={modalRefs.about}
                    >
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h1>{t.aboutTitle}</h1>
                        <div className="modal-body">
                            <p className="about-text">{t.aboutText1}</p>
                        </div>
                    </div>
                </div>
            )}
            {activeModal === 'priceList' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content price-list-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h2>{t.priceList}</h2>
                        <div className="modal-body">
                            {services.map((service, index) => (
                                <label key={index} className="price-option">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(index)}
                                        onChange={() => toggle(index)}
                                    />
                                    {service.label} — {t.priceFrom.replace('{price}', service.price)}
                                </label>
                            ))}
                            <div className="total-line">
                                {t.priceFromTotal.split('{value}')[0]}
                                <strong>{total}</strong>
                                {t.priceFromTotal.split('{value}')[1]}
                            </div>
                            {selected.length > 0 && (
                                <button
                                    className="submit-button"
                                    onClick={() => {
                                        setPreselectedServices(selected.map(i => services[i].label));
                                        closeModal();
                                        openModal('booking');
                                    }}
                                >
                                    {t.bookButton}
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            )}


            {/* Map Modal */}
            {activeModal === 'map' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content map-modal"
                        onClick={e => e.stopPropagation()}
                        ref={modalRefs.map}
                    >
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h2>{t.ourLocation}</h2>

                        <div className="modal-body">
                            <div className="map-container">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d261.757572193307!2d26.72449593161606!3d58.34177934904506!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46eb374c8e9c427b%3A0xef029857eb172aaf!2sParking%20lot%2C%20Jalaka%20tn%2077%2C%2050105%20Tartu!5e0!3m2!1sru!2see!4v1745523138004!5m2!1sru!2see"
                                    width="100%"
                                    height="400"
                                    style={{border: 0, filter: 'grayscale(50%) invert(90%) hue-rotate(180deg)'}}
                                    allowFullScreen=""
                                    loading="lazy"
                                    title="Google Maps"
                                ></iframe>
                            </div>
                            <div className="location-info">
                                <h3>{t.visitUs}</h3>
                                <p>Jalaka 77 Boks 6,50105, Tartu</p>
                                <p>{t.open}</p>
                                <p>{t.phone}: (123) 456-7890</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {activeModal === 'booking' && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-content booking-modal"
                        onClick={e => e.stopPropagation()}
                        ref={modalRefs.booking}
                    >
                        <button className="close-button" onClick={closeModal}>×</button>
                        <h2>{t.bookTitle}</h2>
                        <div className="modal-body">
                            <form className="booking-form" onSubmit={handleBookingSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name">{t.name}</label>
                                    <input type="text" id="name" placeholder={t.placeholderName}/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">{t.email}</label>
                                    <input type="email" id="email" placeholder={t.placeholderEmail}/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">{t.phone}</label>
                                    <input type="tel" id="phone" placeholder={t.placeholderPhone}/>
                                </div>
                                <div className="form-group">
                                <label>{t.service}</label>
                                    {preselectedServices.length > 0 ? (
                                        <ul>
                                            {preselectedServices.map((label, i) => (
                                                <li key={i}>✅ {label}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{
                                            fontStyle: 'italic',
                                            color: '#999'
                                        }}>{t.noServicesSelected || 'No services selected.'}</p>
                                    )}
                                    <button
                                        type="button"
                                        className="submit-button"
                                        onClick={() => {
                                            closeModal(); // Закрываем booking
                                            openModal('priceList'); // Открываем price list
                                        }}
                                    >
                                        {t.selectService || 'Select services'}
                                    </button>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="date">{t.date}</label>
                                    <input type="date" id="date"/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="time">{t.time}</label>
                                    <input type="time" id="time" min="09:00" max="18:00"/>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="notes">{t.notes}</label>
                                    <textarea id="notes" rows="3" placeholder={t.placeholderNotes}></textarea>
                                </div>
                                <button type="submit" className="submit-button">{t.bookButton}</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;