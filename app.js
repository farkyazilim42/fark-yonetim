var kok = String(window.FARK_API || "").replace(/\/$/, "");
var token = sessionStorage.getItem("farkToken") || "";

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"]/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch];
  });
}

function api(path, options) {
  options = options || {};
  options.headers = options.headers || {};
  if (token) options.headers.Authorization = "Bearer " + token;
  if (options.body) options.headers["Content-Type"] = "application/json; charset=utf-8";
  return fetch(kok + path, options).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok) throw new Error(data.hata || "İstek başarısız");
      return data;
    });
  });
}

function goster(giris) {
  document.getElementById("giris").hidden = !giris;
  document.getElementById("panel").hidden = giris;
  document.getElementById("cikis").hidden = giris;
}

function sekme(ad) {
  var sayfalar = document.querySelectorAll(".sayfa");
  var dugmeler = document.querySelectorAll(".sekme");
  for (var i = 0; i < sayfalar.length; i++) sayfalar[i].hidden = sayfalar[i].id !== ad;
  for (var j = 0; j < dugmeler.length; j++) dugmeler[j].className = "sekme" + (dugmeler[j].getAttribute("data-sekme") === ad ? " aktif" : "");
  if (ad === "teknisyen") teknisyenleriYukle();
  if (ad === "adres") musterileriYukle("");
  if (ad === "log") loglariYukle();
}

function kutu(aktif) {
  return aktif ? "evet" : "hayır";
}

function teknisyenleriYukle() {
  api("/api/teknisyenler").then(function (data) {
    var html = "<table><thead><tr><th>Ad</th><th>Yetkiler</th><th>Durum</th><th></th></tr></thead><tbody>";
    var rows = data.kayitlar || [];
    if (!rows.length) html += "<tr><td colspan='4'>Henüz teknisyen yok.</td></tr>";
    rows.forEach(function (row) {
      html += "<tr><td>" + esc(row.ad) + "<br><span class='mini'>" + esc(row.kullanici) + "</span></td><td class='mini'>Bağlantı " + kutu(row.baglanti) + " · Dosya " + kutu(row.dosya) + " · Pano " + kutu(row.pano) + " · Ses " + kutu(row.ses) + " · Kayıt " + kutu(row.kayit) + "</td><td>" + (row.aktif ? "Aktif" : "Kapalı") + "</td><td><button type='button' class='ikincil mini' data-kapat='" + esc(row.id) + "' data-aktif='" + (row.aktif ? "1" : "0") + "' data-baglanti='" + (row.baglanti ? "1" : "0") + "' data-dosya='" + (row.dosya ? "1" : "0") + "' data-pano='" + (row.pano ? "1" : "0") + "' data-ses='" + (row.ses ? "1" : "0") + "' data-kayit='" + (row.kayit ? "1" : "0") + "'>" + (row.aktif ? "Girişi kapat" : "Girişi aç") + "</button></td></tr>";
    });
    html += "</tbody></table>";
    var liste = document.getElementById("teknisyen-liste");
    liste.innerHTML = html;
    var buttons = liste.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].onclick = function () {
        var b = this;
        api("/api/teknisyenler/guncelle", {
          method: "POST",
          body: JSON.stringify({
            id: b.getAttribute("data-kapat"),
            aktif: b.getAttribute("data-aktif") !== "1",
            baglanti: b.getAttribute("data-baglanti") === "1",
            dosya: b.getAttribute("data-dosya") === "1",
            pano: b.getAttribute("data-pano") === "1",
            ses: b.getAttribute("data-ses") === "1",
            kayit: b.getAttribute("data-kayit") === "1"
          })
        }).then(teknisyenleriYukle).catch(function (err) {
          document.getElementById("teknisyen-hata").textContent = err.message;
        });
      };
    }
  }).catch(function () { goster(true); });
}

function musterileriYukle(q) {
  api("/api/musteriler?q=" + encodeURIComponent(q || "")).then(function (data) {
    var html = "<table><thead><tr><th>Unvan</th><th>Telefon</th><th>Son ID</th><th>Not</th></tr></thead><tbody>";
    var rows = data.kayitlar || [];
    if (!rows.length) html += "<tr><td colspan='4'>Kayıt yok.</td></tr>";
    rows.forEach(function (row) {
      html += "<tr><td>" + esc(row.unvan) + "</td><td>" + esc(row.telefon) + "</td><td>" + esc(row.sonId) + "</td><td>" + esc(row.not) + "</td></tr>";
    });
    html += "</tbody></table>";
    document.getElementById("adres-liste").innerHTML = html;
  });
}

function loglariYukle() {
  api("/api/oturumlar").then(function (data) {
    var html = "<table><thead><tr><th>Teknisyen</th><th>Müşteri</th><th>Başlangıç</th><th>Süre</th><th>Sonuç</th></tr></thead><tbody>";
    var rows = data.kayitlar || [];
    if (!rows.length) html += "<tr><td colspan='5'>Henüz oturum yok.</td></tr>";
    rows.forEach(function (row) {
      html += "<tr><td>" + esc(row.TechnicianName) + "</td><td>" + esc(row.CustomerTitle) + "<br><span class='mini'>" + esc(row.ConnectionId) + "</span></td><td>" + esc(row.StartedAt) + "</td><td>" + esc(row.Seconds) + " sn</td><td>" + esc(row.Result) + "</td></tr>";
    });
    html += "</tbody></table>";
    document.getElementById("log-liste").innerHTML = html;
  });
}

document.getElementById("giris-form").onsubmit = function (ev) {
  ev.preventDefault();
  var form = ev.target;
  document.getElementById("giris-hata").textContent = "";
  api("/api/giris", {
    method: "POST",
    body: JSON.stringify({ kullanici: form.kullanici.value, sifre: form.sifre.value })
  }).then(function (data) {
    token = data.token;
    sessionStorage.setItem("farkToken", token);
    goster(false);
    sekme("teknisyen");
  }).catch(function (err) {
    document.getElementById("giris-hata").textContent = err.message;
  });
};

document.getElementById("cikis").onclick = function () {
  var eski = token;
  token = "";
  sessionStorage.removeItem("farkToken");
  goster(true);
  if (!eski) return;
  fetch(kok + "/api/cikis", { method: "POST", headers: { Authorization: "Bearer " + eski } }).catch(function () {});
};

var sekmeler = document.querySelectorAll(".sekme");
for (var i = 0; i < sekmeler.length; i++) {
  sekmeler[i].onclick = function () { sekme(this.getAttribute("data-sekme")); };
}

document.getElementById("teknisyen-form").onsubmit = function (ev) {
  ev.preventDefault();
  var form = ev.target;
  document.getElementById("teknisyen-hata").textContent = "";
  api("/api/teknisyenler", {
    method: "POST",
    body: JSON.stringify({
      kullanici: form.kullanici.value,
      ad: form.ad.value,
      sifre: form.sifre.value,
      baglanti: form.baglanti.checked,
      dosya: form.dosya.checked,
      pano: form.pano.checked,
      ses: form.ses.checked,
      kayit: form.kayit.checked
    })
  }).then(function () {
    form.reset();
    form.baglanti.checked = true;
    teknisyenleriYukle();
  }).catch(function (err) {
    document.getElementById("teknisyen-hata").textContent = err.message;
  });
};

document.getElementById("adres-form").onsubmit = function (ev) {
  ev.preventDefault();
  var form = ev.target;
  api("/api/musteriler", {
    method: "POST",
    body: JSON.stringify({
      unvan: form.unvan.value,
      telefon: form.telefon.value,
      not: form.not.value,
      sonId: form.sonId.value
    })
  }).then(function () {
    form.reset();
    musterileriYukle("");
  });
};

document.getElementById("ara-form").onsubmit = function (ev) {
  ev.preventDefault();
  musterileriYukle(ev.target.q.value);
};

if (token) {
  goster(false);
  sekme("teknisyen");
}
