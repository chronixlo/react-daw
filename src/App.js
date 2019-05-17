import React, { useEffect, useState } from 'react';
import Tone from 'tone';

function cn(...args) {
  return args.filter(i => i).join(' ');
}

var scaleRoot = 'C';
var scaleRootFrequency = Tone.Frequency(scaleRoot + '4');
var major = true;
var majorScaleSemiTones = [0, 2, 4, 5, 7, 9, 11, 12];
var minorScaleSemiTones = [0, 2, 3, 5, 7, 8, 10, 12];
var semiTones = major ? majorScaleSemiTones : minorScaleSemiTones;
var scale = [];
for (var i = 0; i < 7; i++) {
  var tone = scaleRootFrequency.transpose(semiTones[i]);
  scale.push(tone.toNote().slice(0, -1));
}

const PROGRESSIONS = [
  [1, 5, 6, 4],
  [4, 5, 1, 1],
  [2, 4, 1, 5],
];

var initialProgression = PROGRESSIONS[0];
var noteProgression = initialProgression.map(i => scale[i - 1]);

var kick = new Tone.MembraneSynth().toMaster()
var pad = new Tone.PolySynth().toMaster();
pad.volume.value = -12;
var bass = new Tone.Synth().toMaster();
var lead = new Tone.PolySynth(12, Tone.AMSynth).toMaster();

const OCTAVES = 3;
const arr = new Array(21).fill();


const initialBars = 16;
const initialStepSequence = new Array(initialBars * 4).fill().map(i => []);


function App() {
  const [progressionIndex, setProgressionIndex] = useState(0);
  const [bars, setBars] = useState(initialBars);
  const [stepSequence, setStepSequence] = useState(initialStepSequence);
  const [isPlaying, setPlaying] = useState(false);
  const [loop, setLoop] = useState();

  useEffect(() => {
    if (loop) {
      loop.dispose();
    }

    var _loop = new Tone.Sequence(function (time, col) {
      var note = scale[PROGRESSIONS[progressionIndex][Math.floor(col / 16)] - 1];

      var ssCol = stepSequence[col];

      for (var i = 0; i < ssCol.length; i++) {
        var dog = 20 - ssCol[i];
        lead.triggerAttackRelease(scale[dog % 7] + (4 + Math.floor(dog / 7)), '8n');
      }

      if (col % 4 === 0) {
        kick.triggerAttackRelease('C1', '8n')
      }

      if (col % 16 === 0) {
        var rootNote = note + '4';

        var fifth = Tone.Frequency(rootNote).transpose(7);

        pad.triggerAttackRelease(rootNote, '1n');
        pad.triggerAttackRelease(fifth, '1n');
      }

      bass.triggerAttackRelease(note + '2', '8n')
    }, new Array(64).fill().map((i, idx) => idx), '16n')
    .start(0);

    setLoop(_loop);
  }, [progressionIndex, stepSequence]);

  useEffect(() => {
    isPlaying ? Tone.Transport.start() : Tone.Transport.stop();
  }, [isPlaying])

  return (
    <div>
      <div className="step-sequencer-container">
        <div className="step-sequencer-header-column">
          {
            arr.map((i, idx) =>
              <div key={idx} className="step-sequencer-cell">
                {scale[(20 - idx) % 7]}
              </div>
            )
          }
        </div>

        <div className="step-sequencer">
          {
            stepSequence.map((col, colIdx) =>
              <div key={colIdx} className="step-sequencer-column">
                {
                  arr.map((i, cellIdx) => {
                    const currentRoot = PROGRESSIONS[progressionIndex][Math.floor(colIdx / 16)];
                    const note = (20 - cellIdx - (currentRoot - 1));

                    return <div
                      key={cellIdx}
                      className={cn(
                        'step-sequencer-cell',
                        note % 7 === 0 && 'root-note',
                        ((note - 2) % 7 === 0 || (note - 4) % 7 === 0) && 'suggested-note',
                        col.includes(cellIdx) && 'selected-note'
                      )}
                      onClick={e =>
                        setStepSequence(ss => {
                          const newSs = ss.slice();

                          if (newSs[colIdx].includes(cellIdx)) {
                            newSs[colIdx].splice(newSs[colIdx].indexOf(cellIdx), 1);
                          } else {
                            newSs[colIdx].push(cellIdx);
                          }

                          return newSs;
                        })
                      }
                    ></div>
                  })
                }
              </div>
            )
          }
        </div>
      </div>

      <button onClick={() => setPlaying(i => !i)}>
          {
            isPlaying ?
            <span>▉</span>:
            <span>&#9658;</span>
          }
      </button>

      <select
        value={progressionIndex}
        onChange={e =>
          setProgressionIndex(e.target.value)
        }
      >
        {
          PROGRESSIONS.map((item, index) =>
            <option
              key={index}
              value={index}
            >{item.join(' - ')}</option>
          )
        }
      </select>
    </div>
  );
}

export default App;
