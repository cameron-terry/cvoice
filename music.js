let seventh = false;
let sixth = false;
let chord_extension = null;
let piano_usable = true;
let last_chord = ['C4', 'E4', 'G4'];
let chord_type = 'major';
let recent_chord = null;
let default_octave = '4';
let animations = [];


$(document).ready(function(){
    $('#seventh').change(function(){
        seventh = !!this.checked;
    })
})


$(document).ready(function(){
    $('#chord_tonality').text('major');
})

$(document).ready(function(){
    $('#reset').click(function(){
        last_chord = ['C4', 'E4', 'G4'];
    })
})

$(document).ready(function(){
    $('#play_button').click(function(){
        Tone.start();
        let synth = new Tone.PolySynth().toDestination();
        $(this).prop('disabled', true);
        $(this).css('background-color', 'lightgrey');
        $("#cancel_input_icon").html('■');
        piano_usable = false;
        let result = playChord($('#chord_input').val(), synth);
        if (result) {
            Tone.Transport.start();
        }
    })
})

// TODO: fix bugginess of animation not stopping when transport stops
// TODO: fix transport
$(document).ready(function(){
    $('#clear_button').click(function(){
        $('#cancel_input_icon').html('✕');
        Tone.Transport.stop();
        animations.forEach((element) => element.dispose())
        Tone.Transport.clear();
        $('#play_button').prop('disabled', false).css('background-color', '#4CAF50');

        if (piano_usable) {
            $('#chord_input').val('');
        }
        resetKeys(true);
    })
})

$(document).ready(function(){
    $('#chord_speed_range').on('change', function() {
	       let val = $(this).val();
           $('#chord_speed_value').text(val);
    });
})

// function delay(time) {
//   return new Promise(resolve => setTimeout(resolve, time));
// }

function enableTonality(e) {
    if (piano_usable) {
        if (e.code === 'KeyM') {
            chord_type = 'minor';
        } else if (e.code === 'KeyD') {
            chord_type = 'dominant';
        }
        $('#chord_tonality').text(chord_type);
    }
}

function disableTonality() {
    chord_type = 'major';
    $('#chord_tonality').text(chord_type);
}

document.addEventListener('keydown', enableTonality);
document.addEventListener('keyup', disableTonality);

let notes = ['C','D','E','F','G','A','B'];
let all_notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
let html = "";

for (let i = 0; i < notes.length; i++) {
    let hasSharp = true;
    let note = notes[i];

    if (note === 'E' || note === 'B')
        hasSharp = false;

    html += `<div class='whitenote'
        id='${note + default_octave}'
        onmousedown='noteDown(this, false)'
        onmouseup='noteUp(this, false)'
        onmouseleave='noteUp(this, false)'
        data-note='${note + default_octave}'>`;

    if (hasSharp) {
        html += `<div class='blacknote'
            id='${note + '#' + default_octave}'
            onmousedown='noteDown(this, true)'
            onmouseup='noteUp(this, true)'
            onmouseleave='noteUp(this, true)'
            data-note='${note + '#' + default_octave}'></div>`;
    }

    html += '</div>';
}

$('#piano_container').html(html);
// document.getElementById('piano_container').innerHTML = html;

function getInversions(note) {
    let inversions = null;

    if (chord_extension === '7') {
        if (chord_type === 'major') {
            inversions = [[0, 4, 11], [0, 7, 8], [0, 1, 5]];
        } else if (chord_type === 'minor') {
            inversions = [[0, 3, 10], [0, 7, 9], [0, 2, 5]];
        } else if (chord_type === 'dominant') {
            inversions = [[0, 4, 10], [0, 6, 8], [0, 2, 6]];
        } else {
            alert('chord type not supported!');
        }
    } else if (chord_extension === '6') {
        if (chord_type === 'major') {
            inversions = [[0, 4, 9], [0, 5, 8], [0, 3, 7]];
        } else if (chord_type === 'minor') {
            inversions = [[0, 3, 9], [0, 6, 9], [0, 3, 6]];
        } else {
            alert('chord type not supported!');
        }
    } else if (chord_extension === 'lyd') {
        inversions = [[0, 4, 6], [0, 8, 12], [0, 6, 10]];
    } else {
        if (chord_type === 'major') {
            inversions = [[0, 4, 7], [0, 3, 8], [0, 5, 9]];
        } else if (chord_type === 'minor') {
            inversions = [[0, 3, 7], [0, 4, 9], [0, 5, 8]];
        } else if (chord_type === 'dominant') {
            inversions = [[0, 4, 10], [0, 6, 8], [0, 2, 6]];
        } else if (chord_type === 'augmented') {
            inversions = [[0, 4, 8], [0, 4, 8], [0, 4, 8]];
        } else if (chord_type === 'diminished') {
            inversions = [[0, 3, 6], [0, 3, 9], [0, 6, 9]];
        } else if (chord_type === 'suspended') {
            inversions = [[0, 5, 10], [0, 5, 7], [0, 2, 7]];
        } else {
            alert('chord type not supported!');
            inversions = [];
        }
    }

    let chords = [];
    let chord = [];
    let octave = parseInt(default_octave);
    let current_note_idx = all_notes.indexOf(note);
    let next_note_idx = 0;
    let offset = 0;
    let current_note = note;

    for (let i = 0; i < inversions.length; i++) {
        current_note_idx = all_notes.indexOf(current_note);
        offset = 0;
        octave = parseInt(default_octave);
        chord = [];

        for (let j = 0; j < inversions[i].length; j++) {
            offset = inversions[i][j];
            next_note_idx = current_note_idx + offset;

            if (j === 0) {   // first note should be in octave 4
                if (next_note_idx >= all_notes.length) {
                    next_note_idx = next_note_idx % all_notes.length;
                    octave = parseInt(default_octave);
                }
            } else {
                if (next_note_idx >= all_notes.length) {
                    next_note_idx = next_note_idx % all_notes.length;
                    octave = parseInt(default_octave) + 1;
                }
            }

            chord.push(all_notes[next_note_idx] + octave);

            if (j === 1) {
                current_note = all_notes[next_note_idx];
            }
        }

        chords.push(chord);
    }

    return chords;
}

function getDistance(note_1, note_2) {
    let distances = [];
    let note_1_index;
    let note_2_index;
    let octave;

    if (note_1.length === 3) {
        note_1_index = all_notes.indexOf(all_notes[note_1[0] + note_1[1]]);
        octave = 12 * (note_1[2] - parseInt(default_octave)); // default octave is 4, e.g. C4
    } else {
        note_1_index = all_notes.indexOf(all_notes[note_1[0]]);
        octave = 12 * (note_1[1] - parseInt(default_octave)); // default octave is 4, e.g. C4
    }

    distances.push(note_1_index + octave);

    if (note_2.length === 3) {
        note_2_index = all_notes.indexOf(all_notes[note_2[0] + note_2[1]]);
        octave = 12 * (note_2[2] - parseInt(default_octave));
    } else {
        note_2_index = all_notes.indexOf(all_notes[note_2[0]]);
        octave = 12 * (note_2[1] - parseInt(default_octave));
    }

    distances.push(note_2_index + octave);

    return Math.abs(distances[0] - distances[1]);
}

function bestVoiceLeading(prev, next) {
    all_inversions = getInversions(next);

    if (prev == null) {
        return all_inversions[0];
    }

    let best_chord_voice = null;
    let best_distance = 1000;
    let total_distance = 0;

    for (let p = 0; p < all_inversions.length; p++) {
        total_distance = 0;
        for (let q = 0; q < all_inversions[p].length; q++) {
            total_distance = total_distance + getDistance(last_chord[q], all_inversions[p][q]);
        }

        if (total_distance < best_distance) {
            best_distance = total_distance;
            best_chord_voice = all_inversions[p];
        }
    }

    return best_chord_voice
}

function resetKeys(enable_button) {
    let key = null;
    for (let k = 0; k < all_notes.length; k++) {
        key = document.getElementById(all_notes[k] + '4');
        if (key != null) {
            let isSharp = key.id.includes("#");
            key.style.background = isSharp ? '#777' : 'white';
        }
    }
    $('#chord_tonality').text('major');

    if (enable_button) {
        $('#play_button').prop('disabled', false).css('background-color', '#4CAF50');
        $('#cancel_input_icon').html('✕');
        piano_usable = true;
    }
}

function autoNoteDown(root, chord, c_type, c_extension) {
    resetKeys();

    for (let j = 0; j < chord.length; j++) {
        let key = document.getElementById(chord[j]);
        if (key != null) {
            let isSharp = key.id.includes("#");
            // if (root.id == key.id) {
            //     key.style.background = '#6fccdf';
            // } else {
            //     key.style.background = isSharp ? 'black' : '#ccc';
            // }
            key.style.background = isSharp ? 'black' : '#ccc';
        }
    }

    if (c_extension === '7') {
        if (c_type === 'major') {
            $('#chord_tonality').text(root + 'Δ7');
        } else if (c_type === 'minor') {
            $('#chord_tonality').text(root + '-7');
        } else if (c_type === 'dominant') {
            $('#chord_tonality').text(root + '7');
        }
    } else if (c_extension === '6') {
        if (c_type === 'major') {
            $('#chord_tonality').text(root + 'Δ6');
        } else if (c_type === 'minor') {
            $('#chord_tonality').text(root + '-6');
        }
    } else if (c_extension === 'lyd') {
        $('#chord_tonality').text(root + ' lydian');
    } else {
        if (c_type === 'major') {
            $('#chord_tonality').text(root + 'Δ');
        } else if (c_type === 'minor') {
            $('#chord_tonality').text(root + '-');
        } else if (c_type === 'dominant') {
            $('#chord_tonality').text(root + '7');
        } else if (c_type === 'augmented') {
            $('#chord_tonality').text(root + '+');
        } else if (c_type === 'diminished') {
            $('#chord_tonality').text(root + '°');
        } else if (c_type === 'suspended') {
            $('#chord_tonality').text(root + 'sus');
        }
    }
}

function autoNoteUp(chord) {
    for (let j = 0; j < chord.length; j++) {
        let key = document.getElementById(chord[j]);
        if (key != null) {
            let isSharp = key.id.includes("#");
            key.style.background = isSharp ? '#777' : 'white';
        }
    }
}

function noteUp(elem, isSharp) {
    try {
        for (let i = 0; i < recent_chord.length; i++) {
            let key = document.getElementById(recent_chord[i])
            if (key != null) {
                let is_sharp = key.id.includes("#")
                key.style.background = is_sharp ? '#777' : 'white';
            }
        }
    } catch (TypeError) {
        // pass
    }
}

function noteDown(elem, isSharp) {
    let synth = new Tone.PolySynth().toDestination();
    synth.volume.value = -6;
    let note = elem.dataset.note;

    let note_name = isSharp ? note[0] + note[1] : note[0];
    recent_chord = bestVoiceLeading(last_chord, note_name);

    // console.log(recent_chord);

    for (let i = 0; i < recent_chord.length; i++) {
        let key = document.getElementById(recent_chord[i]);
        if (key != null) {
            let is_sharp = key.id.includes("#")
            key.style.background = is_sharp ? 'black' : '#ccc';
        }
    }

    synth.sync();
    synth.triggerAttackRelease(recent_chord, "8n");
    Tone.Transport.start();
    event.stopPropagation();

    last_chord = recent_chord;
}

function playChord(text, synth) {
    Tone.Transport.clear();
    synth.volume.value = -6;
    piano_usable = false;

    let chord_time_ms = 60000 / $('#chord_speed_value').text();
    let chord_list = [];
    let chord_list_type = [];
    let chord_extension_list = [];
    let roots = [];

    let prev_seventh_state = seventh;
    let prev_chord = last_chord;
    let prev_chord_type = chord_type;

    let chord_length = [];

    let chords = text.trim().split(' ');

    try {
        for (let c = 0; c < chords.length; c++) {
            let chord_name = (chords[c].includes('b') || chords[c].includes('#')) ? chords[c][0] + chords[c][1] : chords[c][0];
            if (chords[c].includes('b')) {
                let chord_respelled = ""
                for (let m = 0; m < chords[c].length; m++) {
                    let letter = chords[c][m];
                    if (m === 0) {
                        let nextLetter = String.fromCharCode(letter.charCodeAt(letter.length - 1) - 1).replace('@', 'G');
                        chord_respelled = chord_respelled + nextLetter;
                    } else if (m === 1) {
                        chord_respelled = chord_respelled + "#";
                    } else {
                        chord_respelled = chord_respelled + letter;
                    }
                }
                chords[c] = chord_respelled
            }

            if (chords[c].includes('q')) {
                chord_length.push(1)
            } else {
                chord_length.push(0)
            }

            if (chords[c].includes('-')) {
                chord_type = 'minor';
            } else if (chords[c].includes('^')) {
                chord_type = 'major';
            } else if (chords[c].includes('+')) {
                chord_type = 'augmented';
            } else if (chords[c].includes('o')) {
                chord_type = 'diminished';
            } else if (chords[c].includes('sus')) {
                chord_type = 'suspended';
            } else {
                chord_type = 'dominant';
            }

            chord_list_type.push(chord_type);

            if (chords[c].includes('lyd')) {
                chord_extension = 'lyd';
                chord_extension_list.push('lyd');
            }
            else if (chords[c].includes('7')) {
                chord_extension = '7';
                chord_extension_list.push('7');
            } else if (chords[c].includes('6')) {
                chord_extension = '6';
                chord_extension_list.push('6');
            } else {
                chord_extension = null;
                chord_extension_list.push(null);
            }

            let elem = document.getElementById(chords[c][0] + chords[c][1] + default_octave); // means it is sharp

            if (elem != null) {
                let note = elem.dataset.note;

                let note_name = note[0] + note[1];
                recent_chord = bestVoiceLeading(last_chord, note_name);
                chord_list.push(recent_chord);

            } else {
                elem = document.getElementById(chords[c][0] + default_octave); // means it is not sharp
                let note = elem.dataset.note;

                let note_name = note[0];
                recent_chord = bestVoiceLeading(last_chord, note_name);
                chord_list.push(recent_chord);

            }
            roots.push(chord_name);
        }

        const now = Tone.now()
        // https://tonejs.github.io/docs/14.7.77/Synth#sync
        synth.sync();

        chord_list.forEach((element, i) => {
            if (chord_length[i] === 1) {
                synth.triggerAttackRelease(element, "4n", now + (chord_time_ms/1000) * i);
            } else {
                synth.triggerAttackRelease(element, "8n", now + (chord_time_ms/1000) * i);
            }
            animations.push(Tone.Draw.schedule(() => {
                // the callback synced to the animation frame at the given time
                autoNoteDown(roots[i], element, chord_list_type[i], chord_extension_list[i])
            }, now + (chord_time_ms/1000) * i))
        });

        Tone.Draw.schedule(() => {
                // the callback synced to the animation frame at the given time
                resetKeys(true)
            }, now + (chord_time_ms/1000) * chord_list.length)

        // chord_list.forEach((element, index) => {
        //     delay(chord_time_ms * index).then(() => autoNoteDown(roots[index], element, chord_list_type[index], chord_seventh[index], chord_sixth[index]));
        // });

        // delay(chord_time_ms * chord_list.length).then(() => resetKeys(true));

        seventh = prev_seventh_state;
        chord_type = prev_chord_type;
        last_chord = prev_chord;

        return true;

    } catch (err) {
        console.log(err)
        alert("Check your chords!");
        $('#play_button').prop('disabled', false);
        return false
    }
}
