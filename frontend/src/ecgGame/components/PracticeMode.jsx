import React, { useState, useEffect, useRef } from 'react';
import { RHYTHM_INFO } from '../utils/ecgGenerator';
import { HeartSoundGenerator } from '../utils/heartSoundGenerator';
import ECGCanvas from './ECGCanvas';

const PracticeMode = ({ onExit, currentRhythm, isActive, language, t, getRhythmName }) => {
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [totalQuestions] = useState(10);
    const [answered, setAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(true);

    const soundGeneratorRef = useRef(null);
    const audioUnlockedRef = useRef(false);

    // Generar nueva pregunta
    const generateQuestion = () => {
        const rhythms = Object.keys(RHYTHM_INFO);
        const correctRhythm = rhythms[Math.floor(Math.random() * rhythms.length)];

        // Crear opciones de respuesta
        const shuffledRhythms = [...rhythms].sort(() => Math.random() - 0.5);
        const options = shuffledRhythms.slice(0, 4);

        // Asegurar que la respuesta correcta esté en las opciones
        if (!options.includes(correctRhythm)) {
            options[Math.floor(Math.random() * options.length)] = correctRhythm;
        }

        setCurrentQuestion({
            rhythm: correctRhythm,
            options: options,
            bpm: RHYTHM_INFO[correctRhythm].bpm
        });
        setAnswered(false);
        setSelectedAnswer(null);
        setFeedback('');
    };

    // Inicializar con primera pregunta
    useEffect(() => {
        if (isActive) {
            generateQuestion();
        }
    }, [isActive]);

    // Inicializar generador de sonido
    useEffect(() => {
        soundGeneratorRef.current = new HeartSoundGenerator();

        return () => {
            if (soundGeneratorRef.current) {
                soundGeneratorRef.current.dispose();
            }
        };
    }, []);

    // Controlar sonidos del corazón según la pregunta actual
    useEffect(() => {
        if (soundGeneratorRef.current && currentQuestion && soundEnabled && !answered) {
            soundGeneratorRef.current.initialize();
            soundGeneratorRef.current.isPlaying = true;
            soundGeneratorRef.current.rhythmType = currentQuestion.rhythm;
            soundGeneratorRef.current.bpm = currentQuestion.bpm;
        } else if (soundGeneratorRef.current) {
            soundGeneratorRef.current.stop();
        }

        return () => {
            if (soundGeneratorRef.current) {
                soundGeneratorRef.current.stop();
            }
        };
    }, [currentQuestion, soundEnabled, answered]);

    useEffect(() => {
        if (!soundEnabled) return;
        if (!soundGeneratorRef.current) return;
        if (!currentQuestion) return;

        const unlock = () => {
            if (audioUnlockedRef.current) return;
            audioUnlockedRef.current = true;
            soundGeneratorRef.current?.initialize();
            if (currentQuestion) {
                soundGeneratorRef.current.rhythmType = currentQuestion.rhythm;
                soundGeneratorRef.current.bpm = currentQuestion.bpm;
            }
        };

        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, [soundEnabled, currentQuestion]);

    const handleHeartBeat = () => {
        if (soundGeneratorRef.current && soundEnabled && !answered) {
            soundGeneratorRef.current.triggerHeartBeat();
        }
    };

    const handleAnswer = (answer) => {
        if (answered) return;

        setSelectedAnswer(answer);
        setAnswered(true);

        const correct = answer === currentQuestion.rhythm;
        setIsCorrect(correct);

        if (correct) {
            setScore(score + 1);
            setFeedback(t.pmCorrectFeedback);
        } else {
            const correctAnswerLabel = getRhythmName(currentQuestion.rhythm, language, RHYTHM_INFO[currentQuestion.rhythm].name);
            setFeedback(`${t.pmIncorrectFeedback} ${correctAnswerLabel}`);
        }
    };

    const handleNext = () => {
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);

        if (nextCount < totalQuestions) {
            generateQuestion();
        }
    };

    const handleRestart = () => {
        setScore(0);
        setQuestionCount(0);
        generateQuestion();
    };

    const getScorePercentage = () => {
        return Math.round((score / totalQuestions) * 100);
    };

    const getScoreGrade = (percentage) => {
        if (percentage >= 90) return {
            grade: t.gradeExcellent,
            emoji: '🏆',
            color: '#4caf50',
            message: t.msgExcellent
        };
        if (percentage >= 75) return {
            grade: t.gradeVeryGood,
            emoji: '🌟',
            color: '#8bc34a',
            message: t.msgVeryGood
        };
        if (percentage >= 60) return {
            grade: t.gradeGood,
            emoji: '👍',
            color: '#ffc107',
            message: t.msgGood
        };
        if (percentage >= 40) return {
            grade: t.gradeFair,
            emoji: '📚',
            color: '#ff9800',
            message: t.msgFair
        };
        return {
            grade: t.gradeNeedStudy,
            emoji: '💪',
            color: '#f44336',
            message: t.msgNeedStudy
        };
    };

    if (!isActive) return null;

    // Pantalla de resultados finales
    if (questionCount >= totalQuestions) {
        const percentage = getScorePercentage();
        const gradeInfo = getScoreGrade(percentage);

        return (
            <div className="practice-mode">
                <div className="practice-header">
                    <h2><span className="section-icon">✓</span> {t.pmResultsTitle}</h2>
                </div>

                <div className="results-container">
                    <div className="final-score" style={{ borderColor: gradeInfo.color }}>
                        <div className="score-emoji">{gradeInfo.emoji}</div>
                        <div className="score-percentage">{percentage}%</div>
                        <div className="score-grade" style={{ color: gradeInfo.color }}>
                            {gradeInfo.grade}
                        </div>
                        <div className="score-details">
                            {score} {t.pmOutOf} {totalQuestions} {t.pmCorrect}
                        </div>
                    </div>

                    <div className="results-message">
                        <p>{gradeInfo.message}</p>
                    </div>

                    <div className="results-summary">
                        <h3>{t.pmSummaryTitle}</h3>
                        <div className="summary-stats">
                            <div className="summary-item">
                                <span className="summary-label">{t.pmTotalQuestions}</span>
                                <span className="summary-value">{totalQuestions}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">{t.pmCorrectAnswers}</span>
                                <span className="summary-value correct">{score}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">{t.pmIncorrectAnswers}</span>
                                <span className="summary-value incorrect">{totalQuestions - score}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">{t.pmAccuracy}</span>
                                <span className="summary-value">{percentage}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="results-actions">
                        <button onClick={handleRestart} className="btn-primary">
                            <span className="btn-icon">↻</span> {t.pmTryAgain}
                        </button>
                        <button onClick={onExit} className="btn-secondary">
                            <span className="btn-icon">←</span> {t.pmBackToSimulator}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Pantalla de pregunta
    if (!currentQuestion) return null;

    return (
        <div className="practice-mode">
            <div className="practice-header">
                <h2><span className="section-icon">✓</span> {t.pmModeTitle}</h2>
                <div className="header-controls">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
                        title={soundEnabled ? t.pmDisableSound : t.pmEnableSound}
                    >
                        <span className="btn-icon">{soundEnabled ? '♪' : '♪̸'}</span>
                    </button>
                    <button onClick={onExit} className="exit-button">×</button>
                </div>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${((questionCount + 1) / totalQuestions) * 100}%` }}
                />
            </div>

            <div className="question-info">
                <span className="question-number">
                    {t.pmQuestion} {questionCount + 1} {t.pmOf} {totalQuestions}
                </span>
                <span className="current-score">
                    {t.pmScore} {score}/{questionCount + 1}
                </span>
            </div>

            <div className="question-container">
                <h3 className="question-text">
                    {t.pmQuestionText}
                </h3>

                {/* Monitor ECG para la pregunta */}
                <div className="practice-ecg-monitor">
                    <ECGCanvas
                        rhythmType={currentQuestion.rhythm}
                        heartRate={currentQuestion.bpm}
                        amplitude={1.25}
                        speed={1}
                        isRunning={true}
                        showGrid={true}
                        onHeartBeat={handleHeartBeat}
                    />
                </div>

                <div className="question-hints">
                    <div className="hint-item">
                        <span className="hint-label">{t.pmFrequency}</span>
                        <span className="hint-value">{currentQuestion.bpm} {t.bpm}</span>
                    </div>
                </div>

                <div className="options-container">
                    {currentQuestion.options.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleAnswer(option)}
                            disabled={answered}
                            className={`option-button ${answered
                                ? option === currentQuestion.rhythm
                                    ? 'correct'
                                    : option === selectedAnswer
                                        ? 'incorrect'
                                        : ''
                                : ''
                                }`}
                        >
                            {getRhythmName(option, language, RHYTHM_INFO[option].name)}
                        </button>
                    ))}
                </div>

                {answered && (
                    <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                        <p className="feedback-message">{feedback}</p>
                        {!isCorrect && (
                            <p className="feedback-explanation">
                                {RHYTHM_INFO[currentQuestion.rhythm].description}
                            </p>
                        )}
                        <button onClick={handleNext} className="btn-next">
                            {t.pmNextQuestion} <span className="btn-icon">→</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeMode;
