import React, { useState, useEffect, useRef } from 'react';
import ECGCanvas from './components/ECGCanvas';
import ControlPanel from './components/ControlPanel';
import PracticeMode from './components/PracticeMode';
import { RHYTHM_TYPES, RHYTHM_INFO, getRhythmGuide } from './utils/ecgGenerator';
import { HeartSoundGenerator } from './utils/heartSoundGenerator';
import { getText, getRhythmName } from './utils/translations';

function App() {
    const [mode, setMode] = useState('simulator'); // 'simulator' o 'practice'
    const [language, setLanguage] = useState(() => {
        const stored = localStorage.getItem('cardiobeat-language');
        return stored === 'en' ? 'en' : 'es';
    });
    const [rhythmType, setRhythmType] = useState(RHYTHM_TYPES.NORMAL);
    const [heartRate, setHeartRate] = useState(75);
    const amplitude = 1.25; // Fijo (más grande)
    const speed = 1.0; // Fijo
    const [isRunning, setIsRunning] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showGrid, setShowGrid] = useState(true);

    const soundGeneratorRef = useRef(null);
    const t = getText(language);
    const flagsVersion = '20260217-uk-1';

    useEffect(() => {
        const bpmBase = RHYTHM_INFO[rhythmType]?.bpm;
        if (Number.isFinite(bpmBase) && bpmBase > 0 && heartRate !== bpmBase) {
            setHeartRate(bpmBase);
        }
    }, [rhythmType]);

    useEffect(() => {
        localStorage.setItem('cardiobeat-language', language);
    }, [language]);

    // Inicializar generador de sonido
    useEffect(() => {
        soundGeneratorRef.current = new HeartSoundGenerator();

        return () => {
            if (soundGeneratorRef.current) {
                soundGeneratorRef.current.dispose();
            }
        };
    }, []);

    // Controlar sonidos del corazón (sin arrancar AudioContext aquí; eso va en el click)
    useEffect(() => {
        if (!soundGeneratorRef.current) return;

        // En modo práctica, el sonido lo gestiona PracticeMode.
        if (mode !== 'simulator') {
            soundGeneratorRef.current.stop();
            return;
        }

        if (soundEnabled) {
            soundGeneratorRef.current.isPlaying = true;
            soundGeneratorRef.current.rhythmType = rhythmType;
            soundGeneratorRef.current.bpm = heartRate;
        } else {
            soundGeneratorRef.current.stop();
        }
    }, [soundEnabled, rhythmType, heartRate, mode]);

    // Si el sonido está ON por defecto, el navegador puede bloquear AudioContext hasta un gesto del usuario.
    // Esto lo arranca en el primer click/tap/tecla sin que el usuario tenga que "activar" nada.
    useEffect(() => {
        if (!soundEnabled) return;
        if (mode !== 'simulator') return;

        const sg = soundGeneratorRef.current;
        if (!sg) return;

        const unlock = () => {
            try {
                sg.initialize();
                sg.isPlaying = true;
                sg.rhythmType = rhythmType;
                sg.bpm = heartRate;
            } catch {
                // Si fallase, el usuario siempre puede usar el botón de sonido.
            }
        };

        const handler = () => {
            unlock();
            window.removeEventListener('pointerdown', handler);
            window.removeEventListener('keydown', handler);
        };

        window.addEventListener('pointerdown', handler, { once: true });
        window.addEventListener('keydown', handler, { once: true });

        return () => {
            window.removeEventListener('pointerdown', handler);
            window.removeEventListener('keydown', handler);
        };
    }, [soundEnabled, mode, rhythmType, heartRate]);

    const handleHeartBeat = () => {
        if (soundGeneratorRef.current && soundEnabled && isRunning) {
            soundGeneratorRef.current.triggerHeartBeat();
        }
    };

    const handleRhythmChange = (newRhythm) => {
        setRhythmType(newRhythm);
        const rhythmInfo = RHYTHM_INFO[newRhythm];
        setHeartRate(rhythmInfo.bpm);
    };

    const handleReset = () => {
        setRhythmType(RHYTHM_TYPES.NORMAL);
        const rhythmInfo = RHYTHM_INFO[RHYTHM_TYPES.NORMAL];
        setHeartRate(rhythmInfo.bpm);
        setIsRunning(false);
        setSoundEnabled(true);
    };

    const handleToggleSound = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);

        // Importante: muchos navegadores bloquean audio si no se inicia en un gesto del usuario.
        if (!soundGeneratorRef.current) return;

        if (next && mode === 'simulator') {
            try {
                soundGeneratorRef.current.initialize();
                soundGeneratorRef.current.isPlaying = true;
                soundGeneratorRef.current.rhythmType = rhythmType;
                soundGeneratorRef.current.bpm = heartRate;

                // Feedback inmediato al activar sonido.
                soundGeneratorRef.current.triggerHeartBeat();
            } catch {
                // Si el navegador bloquea, lo veremos en consola del navegador.
            }
        }
    };

    const currentRhythmGuide = getRhythmGuide(rhythmType);
    const localizedRhythmName = getRhythmName(rhythmType, language, RHYTHM_INFO[rhythmType].name);

    if (mode === 'practice') {
        return (
            <div className="app">
                <PracticeMode
                    onExit={() => setMode('simulator')}
                    currentRhythm={rhythmType}
                    isActive={true}
                    language={language}
                    t={t}
                    getRhythmName={getRhythmName}
                />
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div className="language-switcher">
                        <img
                            src={language === 'es' ? `/flags/es.svg?v=${flagsVersion}` : `/flags/gb.svg?v=${flagsVersion}`}
                            alt={language === 'es' ? t.languageSpanish : t.languageEnglish}
                            className="language-flag"
                        />
                        <span className="language-chevron" aria-hidden="true">▼</span>
                        <select
                            id="language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            aria-label={t.languageLabel}
                            className="language-native-select"
                        >
                            <option value="es">{t.languageSpanish}</option>
                            <option value="en">{t.languageEnglish}</option>
                        </select>
                    </div>
                    <div className="header-logo-section">
                        <img src="/cardiobeat-logo.jpg" alt="CardioBeat" className="header-logo" />
                    </div>
                    <h1 className="header-title">{t.headerTitle}</h1>
                    <p className="header-subtitle">
                        {t.headerSubtitle}
                    </p>
                </div>
            </header>

            <div className="app-container">
                <aside className="sidebar">
                    <div className="mode-selector">
                        <button
                            onClick={() => setMode('simulator')}
                            className={`mode-button ${mode === 'simulator' ? 'active' : ''}`}
                        >
                            <span className="mode-icon">&#9654;</span> {t.modeSimulator}
                        </button>
                        <button
                            onClick={() => setMode('practice')}
                            className={`mode-button ${mode === 'practice' ? 'active' : ''}`}
                        >
                            <span className="mode-icon">&#10003;</span> {t.modePractice}
                        </button>
                    </div>

                    <ControlPanel
                        language={language}
                        t={t}
                        getRhythmName={getRhythmName}
                        rhythmType={rhythmType}
                        heartRate={heartRate}
                        amplitude={amplitude}
                        isRunning={isRunning}
                        soundEnabled={soundEnabled}
                        onRhythmChange={handleRhythmChange}
                        onToggleRunning={() => setIsRunning(!isRunning)}
                        onToggleSound={handleToggleSound}
                        onReset={handleReset}
                    />
                </aside>

                <div className="main-content">
                    <div className="monitor-section">
                        <div className="monitor-header">
                            <h2>{t.monitorTitle} - {localizedRhythmName}</h2>
                            <div className="monitor-info">
                                <span className="info-badge heart-rate">
                                    <span className="badge-icon">♥</span> {heartRate} {t.bpm}
                                </span>
                                <span className={`info-badge status ${isRunning ? 'active' : 'paused'}`}>
                                    <span className="badge-icon">●</span> {isRunning ? t.active : t.paused}
                                </span>
                            </div>
                        </div>

                        <div className="ecg-displays">
                            <ECGCanvas
                                rhythmType={rhythmType}
                                heartRate={heartRate}
                                amplitude={amplitude}
                                speed={speed}
                                isRunning={isRunning}
                                showGrid={showGrid}
                                onHeartBeat={handleHeartBeat}
                            />
                        </div>

                        <div className="grid-toggle">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                />
                                {t.showGrid}
                            </label>
                        </div>

                        <div className="rhythm-guide">
                            <p>
                                <strong>{t.waves}:</strong> {currentRhythmGuide?.waves || RHYTHM_INFO[rhythmType].description}
                            </p>
                            <p>
                                <strong>{t.howToRead}:</strong> {currentRhythmGuide?.interpretation || t.defaultInterpretation}
                            </p>
                            {currentRhythmGuide?.keyPoints?.length > 0 && (
                                <div className="rhythm-guide-block">
                                    <strong>{t.keyPoints}:</strong>
                                    <ul>
                                        {currentRhythmGuide.keyPoints.map((point, index) => (
                                            <li key={`key-point-${index}`}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {currentRhythmGuide?.readingSteps?.length > 0 && (
                                <div className="rhythm-guide-block">
                                    <strong>{t.readingSequence}:</strong>
                                    <ol>
                                        {currentRhythmGuide.readingSteps.map((step, index) => (
                                            <li key={`reading-step-${index}`}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                            {currentRhythmGuide?.warning && (
                                <p className="rhythm-guide-warning">
                                    <strong>{t.warning}:</strong> {currentRhythmGuide.warning}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="info-panel">
                    <h3><span className="section-icon">i</span> {t.infoTitle}</h3>
                    <div className="info-content">
                        <p>
                            <strong>{t.aboutSimulator}</strong>
                        </p>
                        <ul>
                            {t.aboutItems.map((item, index) => (
                                <li key={`about-item-${index}`}>{item}</li>
                            ))}
                        </ul>
                        <p>
                            <strong>{t.leadTitle}</strong>
                        </p>
                        <ul>
                            {t.leadItems.map((item, index) => (
                                <li key={`lead-item-${index}`}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <img src="/cardiobeat-logo.jpg" alt="CardioBeat" className="footer-logo-img" />
                    </div>
                    <div className="footer-info">
                        <p className="footer-disclaimer">{t.footerDisclaimer}</p>
                        <p className="footer-copyright">{t.footerCopyright}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
