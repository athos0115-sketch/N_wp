(function () {
  'use strict';

  const STORAGE_KEY = 'n_wp_auth_config_v1';

  const els = {
    appShell: document.getElementById('appShell'),
    topBarFocal: document.getElementById('topBarFocal'),
    workCardFocal: document.getElementById('workCardFocal'),
    liveEmberDot: document.getElementById('liveEmberDot'),
    bannerEmberDot: document.getElementById('bannerEmberDot'),
    syncMeta: document.getElementById('syncMeta'),
    toggleConfigBtn: document.getElementById('toggleConfigBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    errorToast: document.getElementById('errorToast'),
    alertBanner: document.getElementById('alertBanner'),
    alertBannerText: document.getElementById('alertBannerText'),
    alertBadge: document.getElementById('alertBadge'),
    valRemainingLeave: document.getElementById('valRemainingLeave'),
    valUsedLeave: document.getElementById('valUsedLeave'),
    valPendingDeadline: document.getElementById('valPendingDeadline'),
    valTargetMonth: document.getElementById('valTargetMonth'),
    valMtdOvertime: document.getElementById('valMtdOvertime'),
    valOtEfficiency: document.getElementById('valOtEfficiency'),
    valActualWork: document.getElementById('valActualWork'),
    pillT1: document.getElementById('pillT1'),
    pillT2: document.getElementById('pillT2'),
    pillT34: document.getElementById('pillT34'),
    valEstNetPay: document.getElementById('valEstNetPay'),
    valAprJunAvg: document.getElementById('valAprJunAvg'),
    valGradeThreshold: document.getElementById('valGradeThreshold'),
    valBaseSalarySub: document.getElementById('valBaseSalarySub'),
    chartViewport: document.getElementById('chartViewport'),
    trendChartSvg: document.getElementById('trendChartSvg'),
    chartGridGroup: document.getElementById('chartGridGroup'),
    chartAreaPath: document.getElementById('chartAreaPath'),
    chartLinePath: document.getElementById('chartLinePath'),
    chartHoverHairline: document.getElementById('chartHoverHairline'),
    chartPointsGroup: document.getElementById('chartPointsGroup'),
    chartTooltip: document.getElementById('chartTooltip'),
    chartEmptyState: document.getElementById('chartEmptyState'),
    chartAxisLabels: document.getElementById('chartAxisLabels'),
    segButtons: Array.from(document.querySelectorAll('.seg-btn[data-chart-metric]')),
    aiContextText: document.getElementById('aiContextText'),
    copyAiBtn: document.getElementById('copyAiBtn'),
    archiveCount: document.getElementById('archiveCount'),
    archiveTableBody: document.getElementById('archiveTableBody'),
    fifoCount: document.getElementById('fifoCount'),
    fifoTableBody: document.getElementById('fifoTableBody'),
    // Auth Lock Modal
    authBackdrop: document.getElementById('authBackdrop'),
    authForm: document.getElementById('authForm'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    authErrorBox: document.getElementById('authErrorBox'),
    apiUrlInput: document.getElementById('apiUrlInput'),
    pinInput: document.getElementById('pinInput'),
    unlockBtn: document.getElementById('unlockBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
  };

  let activeChartMetric = 'net';
  let cachedArchiveRows = [];
  let plottedPoints = [];
  let isUnlocked = false;

  function loadAuthConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          apiUrl: String(parsed.apiUrl || '').trim(),
          secretKey: String(parsed.secretKey || '').trim(),
        };
      }
    } catch (_) {
      // ignore storage errors
    }
    return { apiUrl: '', secretKey: '' };
  }

  function saveAuthConfig(cfg) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        apiUrl: String(cfg.apiUrl || '').trim(),
        secretKey: String(cfg.secretKey || '').trim(),
      }));
    } catch (_) {
      // ignore storage errors
    }
  }

  function clearAuthConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // ignore storage errors
    }
  }

  function hasValidConfig(cfg) {
    return validateHttpsUrl(cfg.apiUrl) && Boolean(cfg.secretKey);
  }

  function validateHttpsUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  function showError(msg) {
    if (!msg) {
      els.errorToast.hidden = true;
      els.errorToast.textContent = '';
      return;
    }
    els.errorToast.textContent = msg;
    els.errorToast.hidden = false;
  }

  function showModalError(msg, highlightPin) {
    if (!msg) {
      els.authErrorBox.hidden = true;
      els.authErrorBox.textContent = '';
      els.pinInput.classList.remove('is-error');
      return;
    }
    els.authErrorBox.textContent = msg;
    els.authErrorBox.hidden = false;
    els.pinInput.classList.toggle('is-error', Boolean(highlightPin));
  }

  function openAuthModal(options) {
    const opts = options || {};
    const cfg = loadAuthConfig();
    els.apiUrlInput.value = cfg.apiUrl || '';
    els.pinInput.value = cfg.secretKey || '';

    const allowClose = Boolean(opts.allowClose && isUnlocked);
    els.closeModalBtn.hidden = !allowClose;
    els.logoutBtn.hidden = !cfg.apiUrl && !cfg.secretKey;

    showModalError(opts.errorMsg || '', Boolean(opts.highlightPin));

    els.authBackdrop.hidden = false;
    if (!isUnlocked) {
      els.appShell.classList.add('is-locked');
      els.appShell.setAttribute('aria-hidden', 'true');
    }

    if (opts.highlightPin) {
      els.pinInput.focus();
      els.pinInput.select();
    } else if (!els.apiUrlInput.value) {
      els.apiUrlInput.focus();
    } else {
      els.pinInput.focus();
    }
  }

  function closeAuthModal() {
    els.authBackdrop.hidden = true;
    els.appShell.classList.remove('is-locked');
    els.appShell.removeAttribute('aria-hidden');
    showModalError('', false);
  }

  function resetDashboardView() {
    isUnlocked = false;
    cachedArchiveRows = [];
    plottedPoints = [];

    els.syncMeta.textContent = '인증 대기 중';
    els.alertBanner.classList.remove('is-alert');
    els.alertBannerText.textContent = '연결 대기 중';
    els.alertBadge.textContent = '대기';

    els.valRemainingLeave.textContent = '-';
    els.valUsedLeave.textContent = '-';
    els.valPendingDeadline.textContent = '-';
    els.valPendingDeadline.classList.remove('is-warn');

    els.valTargetMonth.textContent = '-';
    els.valActualWork.textContent = '-';
    els.valMtdOvertime.textContent = '-';
    els.valMtdOvertime.classList.remove('is-alert');
    els.valOtEfficiency.textContent = '-';

    els.valEstNetPay.textContent = '-';
    els.valAprJunAvg.textContent = '-';
    els.valGradeThreshold.textContent = '-';
    els.valBaseSalarySub.textContent = '기본급 - 엔';

    updateTriggerPill(els.pillT1, 'T1 반차 기한', '대기');
    updateTriggerPill(els.pillT2, 'T2 4~6월 보수', '대기');
    updateTriggerPill(els.pillT34, 'T3/T4 연차·잔업', '대기');

    els.topBarFocal.setAttribute('data-thermal', 'calm');
    els.workCardFocal.setAttribute('data-thermal', 'calm');
    els.liveEmberDot.setAttribute('data-thermal', 'calm');
    els.liveEmberDot.setAttribute('data-live', 'false');
    els.bannerEmberDot.setAttribute('data-thermal', 'calm');
    els.bannerEmberDot.setAttribute('data-live', 'false');

    els.aiContextText.textContent = '-';
    renderChart();
    renderArchiveTable([]);
    renderHalfLeaveTable([]);
  }

  async function fetchActiveData(cfgOverride) {
    const cfg = cfgOverride || loadAuthConfig();
    showError('');

    if (!hasValidConfig(cfg)) {
      resetDashboardView();
      openAuthModal({ allowClose: false });
      return;
    }

    els.syncMeta.textContent = 'API 인증 및 데이터 동기화 중';
    els.unlockBtn.disabled = true;

    try {
      const endpointUrl = new URL(cfg.apiUrl);
      endpointUrl.searchParams.set('key', cfg.secretKey);

      const res = await fetch(endpointUrl.toString(), { redirect: 'follow', cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} 응답 오류`);
      }

      const json = await res.json();
      if (json && json.error) {
        if (String(json.error).toLowerCase() === 'unauthorized') {
          resetDashboardView();
          openAuthModal({
            allowClose: false,
            highlightPin: true,
            errorMsg: 'Unauthorized: 비밀키(PIN)가 일치하지 않습니다. 다시 입력해 주세요',
          });
          return;
        }
        throw new Error(String(json.error));
      }

      isUnlocked = true;
      closeAuthModal();
      renderPayload(json);
    } catch (err) {
      if (!isUnlocked) {
        openAuthModal({
          allowClose: false,
          errorMsg: `연결 실패: ${err.message}`,
        });
      } else {
        showError(`동기화 실패: ${err.message}`);
      }
      els.syncMeta.textContent = '연결 오류';
    } finally {
      els.unlockBtn.disabled = false;
    }
  }

  function renderPayload(payload) {
    const dash = payload.dashboard || {};
    els.syncMeta.textContent = dash.syncInfo || 'Apps Script API 연결됨';

    const bannerText = String(dash.alertBanner || '정상 가동 중');
    const isAlert = bannerText.includes('GEMINI 상담 필요') || bannerText.includes('CONSULT GEMINI NOW');

    els.alertBanner.classList.toggle('is-alert', isAlert);
    els.alertBannerText.textContent = bannerText;
    els.alertBadge.textContent = isAlert ? '상담 필요' : '정상';

    const remNum = parseNumberLike(dash.remainingLeave);
    els.valRemainingLeave.textContent = remNum !== null ? `${remNum.toFixed(1)} 일` : String(dash.remainingLeave || '-');
    els.valUsedLeave.textContent = String(dash.usedLeaveSummary || '-');

    const pendingStr = String(dash.pendingHalfLeave || '없음');
    els.valPendingDeadline.textContent = pendingStr;
    els.valPendingDeadline.classList.toggle('is-warn', pendingStr.includes('D-'));

    const monthSummary = String(dash.targetMonthSummary || '-');
    const ymMatch = monthSummary.match(/^(\d{4}-\d{2})\s*\(([^)]+)\)/);
    els.valTargetMonth.textContent = ymMatch ? ymMatch[1] : monthSummary;
    els.valActualWork.textContent = ymMatch ? ymMatch[2] : '-';

    const otNum = parseNumberLike(dash.mtdOvertime);
    els.valMtdOvertime.textContent = otNum !== null ? `${otNum.toFixed(1)} 시간` : String(dash.mtdOvertime || '-');
    els.valMtdOvertime.classList.toggle('is-alert', otNum !== null && otNum > 35);

    const effNum = parseNumberLike(dash.otEfficiency);
    els.valOtEfficiency.textContent = effNum !== null ? `${formatInt(effNum)} 엔/h` : String(dash.otEfficiency || '-');

    els.valEstNetPay.textContent = formatYenValue(dash.estNetPay);
    els.valAprJunAvg.textContent = formatYenValue(dash.aprJunAvgPay);
    els.valGradeThreshold.textContent = formatYenValue(dash.gradeThreshold90);

    const archiveRows = Array.isArray(payload.monthlyArchive) ? payload.monthlyArchive : [];
    const latestArchive = archiveRows.length > 0 ? archiveRows[archiveRows.length - 1] : null;
    const latestBase = latestArchive
      ? parseNumberLike(pickField(latestArchive, ['기본급(엔)', 'Base Salary'], ''))
      : null;
    const activeBase = latestBase !== null
      ? latestBase
      : (payload.settings && payload.settings.baseSalary ? Number(payload.settings.baseSalary) : null);
    els.valBaseSalarySub.textContent = activeBase ? `기본급 ${formatInt(activeBase)} 엔` : '기본급 - 엔';

    const triggers = Array.isArray(dash.triggers) ? dash.triggers : [];
    updateTriggerPill(els.pillT1, 'T1 반차 기한', triggers[0] || '정상');
    updateTriggerPill(els.pillT2, 'T2 4~6월 보수', triggers[1] || '정상');
    updateTriggerPill(els.pillT34, 'T3/T4 연차·잔업', triggers[2] || '정상');

    let thermal = 'calm';
    if (isAlert || (otNum !== null && otNum > 35)) {
      thermal = 'peak';
    } else if (pendingStr.includes('D-') || (otNum !== null && otNum >= 25)) {
      thermal = 'active';
    }

    els.topBarFocal.setAttribute('data-thermal', thermal);
    els.workCardFocal.setAttribute('data-thermal', thermal);
    els.liveEmberDot.setAttribute('data-thermal', thermal);
    els.liveEmberDot.setAttribute('data-live', 'true');
    els.bannerEmberDot.setAttribute('data-thermal', isAlert ? 'peak' : thermal);
    els.bannerEmberDot.setAttribute('data-live', 'true');

    els.aiContextText.textContent = dash.aiContextBlock || '-';

    cachedArchiveRows = archiveRows;
    renderChart();
    renderArchiveTable(archiveRows);
    renderHalfLeaveTable(Array.isArray(payload.halfLeaveLog) ? payload.halfLeaveLog : []);
  }

  function updateTriggerPill(el, label, rawText) {
    const text = String(rawText || '대기');
    const isAlert = text.includes('경보') || text.toUpperCase().includes('ALERT');
    el.classList.toggle('is-alert', isAlert);
    const spans = el.querySelectorAll('span');
    spans[0].textContent = label;
    spans[1].textContent = isAlert ? '경보' : (text.includes('대기') ? '대기' : '정상');
  }

  function pickField(row, keys, fallback) {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (row[k] !== undefined && row[k] !== '') return row[k];
    }
    return fallback !== undefined ? fallback : '-';
  }

  /* ==========================================================================
     Darkroom Filament SVG Bezier Spline Chart
     ======================================================================== */
  function extractChartSeries(rows, metric) {
    return rows.map((r) => {
      const month = String(pickField(r, ['대상 월', 'Month'], '-'));
      const net = parseNumberLike(pickField(r, ['예상 실수령(엔)', 'Est. Net Pay'], '0')) || 0;
      const regOt = parseNumberLike(pickField(r, ['평일·토 잔업(h)', 'Reg/Sat OT (h)'], '0')) || 0;
      const sunOt = parseNumberLike(pickField(r, ['일요일 근무(h)', 'Sunday Work (h)'], '0')) || 0;
      const ot = Math.round((regOt + sunOt) * 10) / 10;
      const eff = parseNumberLike(pickField(r, ['잔업 효율(엔/h)', 'OT Eff (JPY/h)'], '0')) || 0;

      let value = net;
      let formatted = `${formatInt(net)} 엔`;
      if (metric === 'ot') {
        value = ot;
        formatted = `${ot.toFixed(1)} 시간`;
      } else if (metric === 'eff') {
        value = eff;
        formatted = `${formatInt(eff)} 엔/h`;
      }

      return { month, value, formatted, net, ot, eff };
    });
  }

  function buildSmoothSplinePath(pts) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function renderChart() {
    const svgNS = 'http://www.w3.org/2000/svg';
    const series = extractChartSeries(cachedArchiveRows, activeChartMetric);

    els.chartGridGroup.textContent = '';
    els.chartPointsGroup.textContent = '';
    els.chartAxisLabels.textContent = '';
    els.chartTooltip.hidden = true;
    els.chartHoverHairline.setAttribute('hidden', 'true');
    plottedPoints = [];

    if (series.length === 0) {
      els.chartAreaPath.setAttribute('d', '');
      els.chartLinePath.setAttribute('d', '');
      els.chartEmptyState.hidden = false;
      return;
    }

    els.chartEmptyState.hidden = true;

    const W = 640;
    const H = 200;
    const padL = 56;
    const padR = 20;
    const padT = 20;
    const padB = 18;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const vals = series.map((d) => d.value);
    let minVal = Math.min(...vals);
    let maxVal = Math.max(...vals);
    if (minVal === maxVal) {
      minVal = Math.max(0, minVal * 0.85);
      maxVal = maxVal > 0 ? maxVal * 1.15 : 10;
    } else {
      const margin = (maxVal - minVal) * 0.18;
      minVal = Math.max(0, minVal - margin);
      maxVal = maxVal + margin;
    }

    [0, 0.5, 1].forEach((ratio) => {
      const y = padT + plotH * ratio;
      const gridVal = maxVal - (maxVal - minVal) * ratio;

      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(padL));
      line.setAttribute('x2', String(W - padR));
      line.setAttribute('y1', y.toFixed(1));
      line.setAttribute('y2', y.toFixed(1));
      line.setAttribute('class', 'chart-grid-line');
      els.chartGridGroup.appendChild(line);

      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', String(padL - 8));
      label.setAttribute('y', (y + 4).toFixed(1));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('class', 'chart-grid-label');
      label.textContent = formatChartAxisValue(gridVal, activeChartMetric);
      els.chartGridGroup.appendChild(label);
    });

    plottedPoints = series.map((item, idx) => {
      const x = series.length === 1
        ? padL + plotW / 2
        : padL + (plotW * idx) / (series.length - 1);
      const normY = (item.value - minVal) / (maxVal - minVal);
      const y = padT + plotH * (1 - normY);
      return Object.assign({}, item, { x, y, index: idx });
    });

    const linePath = buildSmoothSplinePath(plottedPoints);
    els.chartLinePath.setAttribute('d', linePath);

    if (plottedPoints.length >= 2) {
      const baseLineY = (padT + plotH).toFixed(1);
      const first = plottedPoints[0];
      const last = plottedPoints[plottedPoints.length - 1];
      els.chartAreaPath.setAttribute(
        'd',
        `${linePath} L ${last.x.toFixed(1)} ${baseLineY} L ${first.x.toFixed(1)} ${baseLineY} Z`
      );
    } else {
      els.chartAreaPath.setAttribute('d', '');
    }

    plottedPoints.forEach((pt) => {
      const halo = document.createElementNS(svgNS, 'circle');
      halo.setAttribute('cx', pt.x.toFixed(1));
      halo.setAttribute('cy', pt.y.toFixed(1));
      halo.setAttribute('r', '10');
      halo.setAttribute('class', 'chart-point-halo');
      halo.setAttribute('data-idx', String(pt.index));

      const node = document.createElementNS(svgNS, 'circle');
      node.setAttribute('cx', pt.x.toFixed(1));
      node.setAttribute('cy', pt.y.toFixed(1));
      node.setAttribute('r', '4');
      node.setAttribute('class', 'chart-point-node');
      node.setAttribute('data-idx', String(pt.index));

      els.chartPointsGroup.appendChild(halo);
      els.chartPointsGroup.appendChild(node);

      const span = document.createElement('span');
      span.textContent = pt.month;
      els.chartAxisLabels.appendChild(span);
    });
  }

  function formatChartAxisValue(val, metric) {
    if (metric === 'ot') return `${val.toFixed(1)}h`;
    if (val >= 10000) return `${Math.round(val / 1000)}k`;
    return `${Math.round(val)}`;
  }

  function highlightChartPoint(clientX) {
    if (plottedPoints.length === 0) return;
    const svgRect = els.trendChartSvg.getBoundingClientRect();
    if (!svgRect.width) return;

    const svgX = ((clientX - svgRect.left) / svgRect.width) * 640;
    let nearest = plottedPoints[0];
    let minDist = Math.abs(svgX - nearest.x);

    for (let i = 1; i < plottedPoints.length; i++) {
      const dist = Math.abs(svgX - plottedPoints[i].x);
      if (dist < minDist) {
        minDist = dist;
        nearest = plottedPoints[i];
      }
    }

    els.chartHoverHairline.setAttribute('x1', nearest.x.toFixed(1));
    els.chartHoverHairline.setAttribute('x2', nearest.x.toFixed(1));
    els.chartHoverHairline.setAttribute('y1', '14');
    els.chartHoverHairline.setAttribute('y2', '182');
    els.chartHoverHairline.removeAttribute('hidden');

    els.chartPointsGroup.querySelectorAll('.chart-point-halo, .chart-point-node').forEach((node) => {
      const isTarget = Number(node.getAttribute('data-idx')) === nearest.index;
      node.classList.toggle('is-active', isTarget);
    });

    els.chartTooltip.textContent = `${nearest.month} · ${nearest.formatted} (잔업 ${nearest.ot.toFixed(1)}h)`;
    els.chartTooltip.hidden = false;

    const vpRect = els.chartViewport.getBoundingClientRect();
    const rawLeftPx = (nearest.x / 640) * vpRect.width;
    const halfTip = els.chartTooltip.offsetWidth / 2;
    const clampedLeft = Math.min(
      Math.max(halfTip + 8, rawLeftPx),
      Math.max(halfTip + 8, vpRect.width - halfTip - 8)
    );
    els.chartTooltip.style.left = `${clampedLeft}px`;
  }

  function clearChartHighlight() {
    els.chartHoverHairline.setAttribute('hidden', 'true');
    els.chartTooltip.hidden = true;
    els.chartPointsGroup.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
  }

  /* ==========================================================================
     Tables
     ======================================================================== */
  function renderArchiveTable(rows) {
    els.archiveTableBody.textContent = '';
    els.archiveCount.textContent = `${rows.length}개월`;
    if (rows.length === 0) {
      els.archiveTableBody.appendChild(createEmptyRow(8, '월별 아카이브 데이터가 없습니다'));
      return;
    }

    rows.slice().reverse().forEach((r) => {
      const regOt = parseNumberLike(pickField(r, ['평일·토 잔업(h)', 'Reg/Sat OT (h)'], '0')) || 0;
      const sunOt = parseNumberLike(pickField(r, ['일요일 근무(h)', 'Sunday Work (h)'], '0')) || 0;
      const totalOt = (regOt + sunOt).toFixed(1);

      const grossVal = pickField(r, ['과세 총지급(엔)', 'Taxable Gross'], '');
      const netVal = pickField(r, ['예상 실수령(엔)', 'Est. Net Pay'], '');
      const effVal = pickField(r, ['잔업 효율(엔/h)', 'OT Eff (JPY/h)'], '');
      const verifyText = String(pickField(r, ['월집계 검증', 'Verify vs 月集計'], '-'));
      const lockText = String(pickField(r, ['잠금 상태'], '집계중'));

      const tr = document.createElement('tr');
      appendCell(tr, pickField(r, ['대상 월', 'Month']));
      appendCell(tr, pickField(r, ['실근로(h)', 'Actual Work (h)']));
      appendCell(tr, totalOt);
      appendCell(tr, grossVal ? `${grossVal} 엔` : '-');
      appendCell(tr, netVal ? `${netVal} 엔` : '-');
      appendCell(tr, effVal ? `${effVal} 엔` : '-');

      const verifyTd = document.createElement('td');
      const vBadge = document.createElement('span');
      const isOk = verifyText === '정상' || verifyText === 'OK';
      vBadge.className = `status-tag ${isOk ? 'is-ok' : 'is-warn'}`;
      vBadge.textContent = verifyText;
      verifyTd.appendChild(vBadge);
      tr.appendChild(verifyTd);

      const lockTd = document.createElement('td');
      const lBadge = document.createElement('span');
      lBadge.className = `status-tag ${lockText === '확정' ? 'is-ok' : 'is-warn'}`;
      lBadge.textContent = lockText;
      lockTd.appendChild(lBadge);
      tr.appendChild(lockTd);

      els.archiveTableBody.appendChild(tr);
    });
  }

  function renderHalfLeaveTable(rows) {
    els.fifoTableBody.textContent = '';
    els.fifoCount.textContent = `${rows.length}건`;
    if (rows.length === 0) {
      els.fifoTableBody.appendChild(createEmptyRow(6, '반차 FIFO 이력이 없습니다'));
      return;
    }

    rows.slice().reverse().forEach((r) => {
      const tr = document.createElement('tr');
      appendCell(tr, pickField(r, ['사용일', 'Leave Date']));
      appendCell(tr, pickField(r, ['2개월 만료일', '2M Deadline']));

      const statusTd = document.createElement('td');
      const status = String(pickField(r, ['FIFO 상태', 'FIFO Status'], '-'));
      const badge = document.createElement('span');
      let tagClass = 'is-ok';
      if (status === '기한 만료' || status === 'EXPIRED') tagClass = 'is-alert';
      else if (status === '매칭 대기' || status === 'PENDING') tagClass = 'is-warn';
      badge.className = `status-tag ${tagClass}`;
      badge.textContent = status;
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      appendCell(tr, pickField(r, ['매칭일', 'Paired Date']));
      appendCell(tr, pickField(r, ['잔여 기한', 'D-Day']));
      appendCell(tr, pickField(r, ['급여 반영', 'Payroll Impact']));

      els.fifoTableBody.appendChild(tr);
    });
  }

  function appendCell(tr, text) {
    const td = document.createElement('td');
    td.textContent = String(text);
    tr.appendChild(td);
  }

  function createEmptyRow(colSpan, msg) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.textContent = msg;
    tr.appendChild(td);
    return tr;
  }

  function parseNumberLike(val) {
    if (typeof val === 'number' && !isNaN(val)) return val;
    const cleaned = String(val || '').replace(/[^0-9.\-]/g, '');
    if (!cleaned) return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  function formatInt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function formatYenValue(val) {
    const num = parseNumberLike(val);
    if (num !== null) return `${formatInt(num)} 엔`;
    return String(val || '-');
  }

  // Cursor-Tracked 1px Warm Rim-Light (Strict 2 Focal Elements Only)
  function attachRimTracking(el) {
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.min(0.92, Math.max(0.08, (e.clientX - rect.left) / rect.width));
      el.style.setProperty('--rim-x', `${(ratio * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rim-x', '50%');
    });
  }

  attachRimTracking(els.topBarFocal);
  attachRimTracking(els.workCardFocal);

  // Chart Metric Switcher & Pointer/Touch Inspection
  els.segButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeChartMetric = btn.getAttribute('data-chart-metric') || 'net';
      els.segButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderChart();
    });
  });

  els.chartViewport.addEventListener('pointermove', (e) => highlightChartPoint(e.clientX));
  els.chartViewport.addEventListener('pointerdown', (e) => highlightChartPoint(e.clientX));
  els.chartViewport.addEventListener('pointerleave', clearChartHighlight);

  // Auth Modal & Control Bindings
  els.toggleConfigBtn.addEventListener('click', () => {
    openAuthModal({ allowClose: isUnlocked });
  });

  els.closeModalBtn.addEventListener('click', () => {
    if (isUnlocked) closeAuthModal();
  });

  els.authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const apiUrl = els.apiUrlInput.value.trim();
    const secretKey = els.pinInput.value.trim();

    if (!validateHttpsUrl(apiUrl)) {
      showModalError('유효한 HTTPS Apps Script 웹 앱 URL을 입력해 주세요', false);
      els.apiUrlInput.focus();
      return;
    }
    if (!secretKey) {
      showModalError('비밀키(PIN)를 입력해 주세요', true);
      els.pinInput.focus();
      return;
    }

    const nextCfg = { apiUrl, secretKey };
    saveAuthConfig(nextCfg);
    fetchActiveData(nextCfg);
  });

  els.logoutBtn.addEventListener('click', () => {
    clearAuthConfig();
    resetDashboardView();
    openAuthModal({ allowClose: false });
  });

  els.refreshBtn.addEventListener('click', () => {
    fetchActiveData();
  });

  els.copyAiBtn.addEventListener('click', async () => {
    const text = els.aiContextText.textContent || '';
    if (!text || text === '-') return;
    try {
      await navigator.clipboard.writeText(text);
      const orig = els.copyAiBtn.textContent;
      els.copyAiBtn.textContent = '복사 완료';
      setTimeout(() => {
        els.copyAiBtn.textContent = orig;
      }, 1400);
    } catch (_) {
      showError('클립보드 복사에 실패했습니다. 텍스트를 길게 눌러 복사해 주세요');
    }
  });

  // Init
  resetDashboardView();
  fetchActiveData();
})();
