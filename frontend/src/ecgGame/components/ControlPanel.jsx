import React from 'react';
import { RHYTHM_INFO } from '../utils/ecgGenerator';
import { getRhythmDescription } from '../utils/translations';

const ControlPanel = ({
    language,
    t,
    getRhythmName,
    rhythmType,
    heartRate,
    amplitude,
    isRunning,
    soundEnabled,
    onRhythmChange,
    onToggleRunning,
    onToggleSound,
    onReset
}) => {
    const currentRhythm = RHYTHM_INFO[rhythmType];
    const localizedCurrentRhythmName = getRhythmName(rhythmType, language, currentRhythm.name);

    return (
        <div className="control-panel">
            <div className="control-section">
                <h3><span className="section-icon">♥</span> {t.cpRhythmType}</h3>
                <select
                    value={rhythmType}
                    onChange={(e) => onRhythmChange(e.target.value)}
                    className="control-select"
                >
                    {Object.entries(RHYTHM_INFO).map(([key, info]) => (
                        <option key={key} value={key}>
                            {getRhythmName(key, language, info.name)}
                        </option>
                    ))}
                </select>
                <div className="rhythm-info">
                    <p className="rhythm-description">{getRhythmDescription(currentRhythm.description, language)}</p>
                    <p className="rhythm-bpm">{t.cpBaseBpm} {currentRhythm.bpm}</p>
                </div>
            </div>

            <div className="control-section">
                <h3><span className="section-icon">⚙</span> {t.cpParameters}</h3>

                <div className="control-group">
                    <div className="param-display">
                        <span className="param-label">{t.cpHeartRate}</span>
                        <span className="param-value">{heartRate} {t.bpm}</span>
                    </div>
                </div>

                <div className="control-group">
                    <div className="param-display">
                        <span className="param-label">{t.cpAmplitude}</span>
                        <span className="param-value">{Number.isFinite(amplitude) ? amplitude.toFixed(2) : '—'}</span>
                    </div>
                </div>

                <div className="control-group">
                    <div className="param-display">
                        <span className="param-label">{t.cpSpeed}</span>
                        <span className="param-value">1.00x</span>
                    </div>
                </div>
            </div>

            <div className="control-section">
                <h3><span className="section-icon">▶</span> {t.cpControls}</h3>
                <div className="button-group">
                    <button
                        onClick={onToggleRunning}
                        className={`control-button ${isRunning ? 'pause' : 'play'}`}
                    >
                        <span className="btn-icon">{isRunning ? '❚❚' : '▶'}</span> {isRunning ? t.cpPause : t.cpStart}
                    </button>

                    <button
                        onClick={onReset}
                        className="control-button reset"
                    >
                        <span className="btn-icon">↻</span> {t.cpReset}
                    </button>

                    <button
                        onClick={onToggleSound}
                        className={`control-button sound ${soundEnabled ? 'enabled' : 'disabled'}`}
                    >
                        <span className="btn-icon">{soundEnabled ? '♪' : '♪̸'}</span> {t.cpSound} {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            <div className="stats-section">
                <div className="stat-item">
                    <span className="stat-label">{t.cpStatus}</span>
                    <span className={`stat-value ${isRunning ? 'running' : 'paused'}`}>
                        {isRunning ? t.cpRunning : t.paused}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">{t.cpCurrentRhythm}</span>
                    <span className="stat-value">{localizedCurrentRhythmName}</span>
                </div>
            </div>
        </div>
    );
};

export default ControlPanel;
