const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rawDir = path.join(__dirname, '../server/data/raw_workbooks');
const dataDir = path.join(__dirname, '../server/data');

const allData = {
  departments: [
    { id: 'dept-acse', code: 'ACSE', name: 'Department of Advanced Computer Science and Engineering' },
    { id: 'dept-ece', code: 'ECE', name: 'Department of Electronics and Communication Engineering' },
    { id: 'dept-cse', code: 'CSE', name: 'Department of Computer Science and Engineering' },
    { id: 'dept-sash', code: 'SASH', name: 'School of Applied Science & Humanities' },
    { id: 'dept-bi', code: 'BIOINFO', name: 'Department of Bioinformatics' },
    { id: 'dept-bt', code: 'BT', name: 'Department of Biotechnology' }
  ],
  groups: [],
  rooms: new Set(),
  entries: []
};

function addGroup(id, name, year, departmentCode, section) {
  if (!allData.groups.some(g => g.name === name)) {
    allData.groups.push({ id, name, year, departmentCode, section, size: 60 });
  }
}

// 1. Authoritative Rooms from master_rooms_and_timetables.xlsx
try {
  const masterWb = XLSX.readFile(path.join(rawDir, 'master_rooms_and_timetables.xlsx'));
  const roomsSheet = masterWb.Sheets['Rooms'];
  const roomsRows = XLSX.utils.sheet_to_json(roomsSheet);
  for (const r of roomsRows) {
    const rawCodes = r['Room code(s) in timetables'] || '';
    const codes = rawCodes.split('|').map(c => c.trim().toUpperCase()).filter(Boolean);
    for (const code of codes) {
      if (code && code !== 'MOBILE' && code.length < 30) {
        allData.rooms.add(code);
      }
    }
  }
  console.log(`Loaded ${roomsRows.length} room definitions from master workbook.`);
} catch (e) {
  console.error('Error loading master rooms:', e.message);
}

// 2. ACSE Timetables
try {
  const acsePath = path.join(dataDir, 'parsed_acse.json');
  if (fs.existsSync(acsePath)) {
    const acseData = JSON.parse(fs.readFileSync(acsePath, 'utf-8'));
    for (const g of acseData.groups) {
      addGroup(g.id, g.name, g.year, 'ACSE', g.section);
    }
    for (const r of acseData.rooms) {
      if (r && r !== 'MOBILE') allData.rooms.add(r.trim().toUpperCase());
    }
    allData.entries.push(...acseData.entries);
    console.log(`Loaded ACSE: ${acseData.groups.length} groups, ${acseData.entries.length} entries.`);
  }
} catch (e) {
  console.error('Error loading ACSE:', e.message);
}

// 3. ECE Timetables
try {
  const ecePath = path.join(dataDir, 'parsed_ece.json');
  if (fs.existsSync(ecePath)) {
    const eceData = JSON.parse(fs.readFileSync(ecePath, 'utf-8'));
    for (const g of eceData.groups) {
      addGroup(g.id, g.name, g.year, 'ECE', g.section);
    }
    for (const r of eceData.rooms) {
      if (r && r !== 'MOBILE') allData.rooms.add(r.trim().toUpperCase());
    }
    allData.entries.push(...eceData.entries);
    console.log(`Loaded ECE: ${eceData.groups.length} groups, ${eceData.entries.length} entries.`);
  }
} catch (e) {
  console.error('Error loading ECE:', e.message);
}

// 4. CSE 3rd Year (22 Sections)
try {
  const cseWb = XLSX.readFile(path.join(rawDir, 'cse_3rd_year.xlsx'));
  const sheet = cseWb.Sheets['All Sections'];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const periodTimes = [
    ['08:15', '09:05'],
    ['09:05', '09:55'],
    ['09:55', '10:45'],
    ['11:00', '11:50'],
    ['11:50', '12:40'],
    ['13:30', '14:20'],
    ['14:20', '15:10']
  ];

  let cseCount = 0;
  // Starting at row 6 (0-indexed 5)
  for (let i = 5; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0] || !row[0].toString().startsWith('Section')) continue;
    const secName = row[0].toString().trim();
    const room = row[1] ? row[1].toString().trim().toUpperCase() : 'N-407';
    const groupName = `III CSE-${secName.replace('Section ', 'Sec ')}`;
    addGroup(`group-cse3-${secName.toLowerCase().replace(/\s+/g, '')}`, groupName, 3, 'CSE', secName);
    allData.rooms.add(room);

    let col = 2;
    for (let d = 0; d < days.length; d++) {
      const day = days[d];
      for (let p = 0; p < 7; p++) {
        if (col < row.length && row[col]) {
          const subj = row[col].toString().trim();
          if (subj && !['BREAK', 'LUNCH', 'HOLIDAY'].includes(subj.toUpperCase())) {
            const [start, end] = periodTimes[p];
            allData.entries.push({
              group: groupName,
              day,
              startTime: start,
              endTime: end,
              subject: subj,
              room,
              faculty: `CSE Faculty (${subj})`,
              entryType: subj.toUpperCase().includes('LAB') ? 'lab' : subj.toUpperCase().includes('TRAINING') ? 'training' : 'class'
            });
            cseCount++;
          }
        }
        col++;
      }
    }
  }
  console.log(`Loaded CSE 3rd Year: 22 sections, ${cseCount} entries.`);
} catch (e) {
  console.error('Error loading CSE 3rd Year:', e.message);
}

// 5. SASH Division 4 (Sheets: New 29, 30, 31, 43, 44, 45, 46, 47, 48, 49, 50, 54, 55, 56, 57)
try {
  const sashWb = XLSX.readFile(path.join(rawDir, 'sash_division_4.xlsx'));
  let sashCount = 0;
  const dayMap = {
    'MONDAY': 'MON', 'TUESDAY': 'TUE', 'WEDNESDAY': 'WED',
    'THURSDAY': 'THU', 'FRIDAY': 'FRI', 'SATURDAY': 'SAT'
  };

  for (const sheetName of sashWb.SheetNames) {
    const sheet = sashWb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 5) continue;

    const groupName = `I SASH SEC-${sheetName.replace('New ', '')}`;
    addGroup(`group-sash-${sheetName.toLowerCase().replace(/\s+/g, '-')}`, groupName, 1, 'SASH', `SEC-${sheetName.replace('New ', '')}`);

    // Find time header row
    let headerRowIdx = -1;
    for (let r = 0; r < 5; r++) {
      if (rows[r] && rows[r].some(c => c && c.toString().includes('8.15') || (c && c.toString().includes('10.05')))) {
        headerRowIdx = r;
        break;
      }
    }
    if (headerRowIdx === -1) continue;

    const timeHeaders = rows[headerRowIdx];
    // Map column index to time range
    const colTimes = {};
    for (let c = 1; c < timeHeaders.length; c++) {
      const th = timeHeaders[c] ? timeHeaders[c].toString().trim() : '';
      const tm = th.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
      if (tm) {
        let sh = parseInt(tm[1], 10);
        const sm = tm[2];
        let eh = parseInt(tm[3], 10);
        const em = tm[4];
        if (sh < 8) sh += 12;
        if (eh < 8 || eh < sh) eh += 12;
        const start = `${String(sh).padStart(2, '0')}:${sm}`;
        const end = `${String(eh).padStart(2, '0')}:${em}`;
        colTimes[c] = [start, end];
      }
    }

    // Process Monday - Saturday rows
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0] && !row[1]) continue;
      const firstCell = (row[0] || row[1] || '').toString().trim().toUpperCase();
      const day = dayMap[firstCell];
      if (!day) continue;

      for (let c = 1; c < row.length; c++) {
        if (!colTimes[c] || !row[c]) continue;
        const cellText = row[c].toString().trim();
        if (!cellText || ['BREAK', 'LUNCH', 'LUNCH BREAK'].includes(cellText.toUpperCase())) continue;

        const [start, end] = colTimes[c];
        // Extract room from cell text
        let room = null;
        const rMatch = cellText.match(/(VBFFTF-?\d+|VBFTTF-?\d+|VBFTF-?\d+|VBTF-?\d+|VBT-?\d+|VBSF-?\d+|VBFF-?\d+|VSF-?\d+|VGF-?\d+|VPTF-?\d+|VPSF-?\d+|NB-?\d+|AFF-?\d+|107)/i);
        if (rMatch) {
          room = rMatch[1].trim().toUpperCase().replace(/\s+/g, '');
          if (room === '107') room = 'N-107';
          allData.rooms.add(room);
        }

        allData.entries.push({
          group: groupName,
          day,
          startTime: start,
          endTime: end,
          subject: cellText.replace(/\n/g, ' '),
          room,
          faculty: 'SASH Faculty',
          entryType: cellText.toUpperCase().includes('(P)') || cellText.toUpperCase().includes('LAB') ? 'lab' : 'class'
        });
        sashCount++;
      }
    }
  }
  console.log(`Loaded SASH Division 4: ${sashCount} entries.`);
} catch (e) {
  console.error('Error loading SASH Division 4:', e.message);
}

// 6. Biotechnology (BT)
try {
  const btWb = XLSX.readFile(path.join(rawDir, 'biotechnology.xlsx'));
  let btCount = 0;
  const dayMap = { 'MON': 'MON', 'TUE': 'TUE', 'WED': 'WED', 'THU': 'THU', 'FRI': 'FRI', 'SAT': 'SAT' };
  const btSlots = [
    ['08:15', '09:05'],
    ['09:05', '09:55'],
    ['10:10', '11:00'],
    ['11:00', '11:50'],
    ['11:50', '12:40'],
    ['13:30', '14:20'],
    ['14:20', '15:10'],
    ['15:10', '16:00'],
    ['16:00', '16:45']
  ];

  for (const sheetName of btWb.SheetNames) {
    if (!sheetName.includes('BT') && !sheetName.includes('M.Tech')) continue;
    const sheet = btWb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 7) continue;

    let defaultRoom = 'ASF-07';
    let year = 2;
    if (sheetName.includes('III')) year = 3;
    else if (sheetName.includes('IV')) year = 4;
    else if (sheetName.includes('M.Tech')) year = 1;

    // Check for room in header
    for (let r = 0; r < 5; r++) {
      if (rows[r]) {
        for (const cell of rows[r]) {
          const rmMatch = cell && cell.toString().match(/Room No:\s*([A-Za-z0-9\s-]+)/i);
          if (rmMatch) {
            defaultRoom = rmMatch[1].trim().toUpperCase().replace(/\s+/g, '-');
            if (defaultRoom !== 'MOBILE') allData.rooms.add(defaultRoom);
          }
        }
      }
    }

    const groupName = sheetName.trim();
    addGroup(`group-bt-${groupName.toLowerCase().replace(/[\s.]+/g, '-')}`, groupName, year, 'BT', groupName);

    for (let r = 5; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0]) continue;
      const day = dayMap[row[0].toString().trim().toUpperCase()];
      if (!day) continue;

      let slotIdx = 0;
      for (let c = 1; c < row.length; c++) {
        const val = row[c] ? row[c].toString().trim() : '';
        if (!val || ['BREAK', 'LUNCH', 'ACTIVITIES'].includes(val.toUpperCase())) continue;
        if (slotIdx < btSlots.length) {
          const [start, end] = btSlots[slotIdx];
          allData.entries.push({
            group: groupName,
            day,
            startTime: start,
            endTime: end,
            subject: val,
            room: defaultRoom !== 'MOBILE' ? defaultRoom : null,
            faculty: 'BT Faculty',
            entryType: val.toUpperCase().includes('(P)') ? 'lab' : 'class'
          });
          btCount++;
        }
        slotIdx++;
      }
    }
  }
  console.log(`Loaded Biotechnology: ${btCount} entries.`);
} catch (e) {
  console.error('Error loading Biotechnology:', e.message);
}

// 7. Bioinformatics (BI)
try {
  const biWb = XLSX.readFile(path.join(rawDir, 'bioinformatics.xlsx'));
  let biCount = 0;
  const dayMap = { 'MON': 'MON', 'TUE': 'TUE', 'WED': 'WED', 'THU': 'THU', 'FRI': 'FRI', 'SAT': 'SAT' };
  const biSlots = [
    ['08:15', '09:05'],
    ['09:05', '09:55'],
    ['10:10', '11:00'],
    ['11:00', '11:50'],
    ['11:50', '12:40'],
    ['13:30', '14:20'],
    ['14:20', '15:10'],
    ['15:10', '16:00'],
    ['16:00', '16:45']
  ];

  for (const sheetName of ['II BI', 'III BI', 'IV BI A', 'IV BI B']) {
    const sheet = biWb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length < 10) continue;

    let defaultRoom = 'ASF-06';
    let year = sheetName.startsWith('II') ? 2 : sheetName.startsWith('III') ? 3 : 4;
    for (let r = 0; r < 10; r++) {
      if (rows[r]) {
        for (const cell of rows[r]) {
          const rmMatch = cell && cell.toString().match(/Room No[.:\s]*([A-Za-z0-9\s-]+)/i);
          if (rmMatch) {
            defaultRoom = rmMatch[1].trim().toUpperCase().replace(/\s+/g, '-');
            if (defaultRoom !== 'MOBILE') allData.rooms.add(defaultRoom);
          }
        }
      }
    }

    const groupName = sheetName.trim();
    addGroup(`group-bi-${groupName.toLowerCase().replace(/[\s.]+/g, '-')}`, groupName, year, 'BIOINFO', groupName);

    for (let r = 8; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const dayCell = (row[0] || row[1] || '').toString().trim().toUpperCase();
      const day = dayMap[dayCell];
      if (!day) continue;

      let slotIdx = 0;
      for (let c = 1; c < row.length; c++) {
        const val = row[c] ? row[c].toString().trim() : '';
        if (!val || ['BREAK', 'LUNCH', 'ACTIVITIES', 'LIFE SKILLS'].includes(val.toUpperCase()) || val.length > 80) continue;
        if (slotIdx < biSlots.length) {
          const [start, end] = biSlots[slotIdx];
          allData.entries.push({
            group: groupName,
            day,
            startTime: start,
            endTime: end,
            subject: val,
            room: defaultRoom !== 'MOBILE' ? defaultRoom : null,
            faculty: 'Bioinformatics Faculty',
            entryType: val.toUpperCase().includes('(P)') ? 'lab' : 'class'
          });
          biCount++;
        }
        slotIdx++;
      }
    }
  }
  console.log(`Loaded Bioinformatics: ${biCount} entries.`);
} catch (e) {
  console.error('Error loading Bioinformatics:', e.message);
}

// Clean and sort rooms
const cleanRooms = Array.from(allData.rooms)
  .map(r => r.trim().toUpperCase())
  .filter(r => r && r !== 'MOBILE' && r.length < 30);
allData.rooms = Array.from(new Set(cleanRooms)).sort();

console.log('--- COMPILE SUMMARY ---');
console.log('Total Departments:', allData.departments.length);
console.log('Total Groups:', allData.groups.length);
console.log('Total Rooms:', allData.rooms.length);
console.log('Total Timetable Entries:', allData.entries.length);

const outputPath = path.join(dataDir, 'all_compiled_timetables.json');
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf-8');
console.log(`Saved compiled data to ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
