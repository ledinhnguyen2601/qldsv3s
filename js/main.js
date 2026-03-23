import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const landingView = document.getElementById("landing-view");
  const authView = document.getElementById("auth-view");
  const selectionView = document.getElementById("selection-view");
  const familyIndex = document.getElementById("family-index");
  const motelIndex = document.getElementById("motel-index");
  const apartmentIndex = document.getElementById("apartment-index");

  const familyFinanceView = document.getElementById("family-finance-view");
  const familyStatsView = document.getElementById("family-stats-view");
  const familyMembersView = document.getElementById("family-members-view");

  const fakeMotelView = document.getElementById("fake-motel-view");
  const fakeApartmentView = document.getElementById("fake-apartment-view");

  // HÀM CHUYỂN MÀN HÌNH NÂNG CẤP (QUÉT SẠCH MỌI TRANG ĐỂ CHỐNG DÍNH)
  function showView(viewElement) {
    document.querySelectorAll(".view-container").forEach((v) => {
      v.style.display = "none";
    });
    if (viewElement) {
      viewElement.style.display =
        viewElement === landingView ? "block" : "flex";
    }
  }

  // LOGIC TRANG CHỦ
  document
    .getElementById("btn-floating-start")
    .addEventListener("click", () => showView(authView));
  document
    .getElementById("btn-start-now")
    .addEventListener("click", () => showView(authView));
  document
    .getElementById("btn-back-landing")
    .addEventListener("click", () => showView(landingView));

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      showView(selectionView);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            currentSpaceId: null,
            role: "user",
          });
        }
      } catch (error) {
        console.error("Lỗi xác thực:", error);
      }
    } else {
      showView(landingView);
    }
  });

  document.getElementById("select-family").addEventListener("click", () => {
    document.getElementById("familySpaceName").innerText =
      "Gia đình của " + (auth.currentUser?.email || "Bạn");
    showView(familyIndex);
  });

  // MỞ KHÓA TẠM THỜI CHO ADMIN
  const handleRestrictedAccess = async (type, elementId, indexView) => {
    document.querySelector(elementId).addEventListener("click", async () => {
      showView(indexView);
    });
  };
  handleRestrictedAccess("motel", "#select-motel", motelIndex);
  handleRestrictedAccess("apartment", "#select-apartment", apartmentIndex);

  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      signOut(auth);
    });
  });

  // ĐĂNG KÝ / ĐĂNG NHẬP
  const errorText = document.getElementById("auth-error");
  document.getElementById("btnRegister").addEventListener("click", () => {
    const e = document.getElementById("email").value,
      p = document.getElementById("password").value;
    if (!e || !p) {
      errorText.style.display = "block";
      errorText.innerText = "Nhập đủ Email/Mật khẩu!";
      return;
    }
    createUserWithEmailAndPassword(auth, e, p)
      .then(() => {
        alert("Đăng ký thành công!");
      })
      .catch((err) => {
        errorText.style.display = "block";
        errorText.innerText = "Lỗi: " + err.message;
      });
  });
  document.getElementById("btnLogin").addEventListener("click", () => {
    const e = document.getElementById("email").value,
      p = document.getElementById("password").value;
    if (!e || !p) {
      errorText.style.display = "block";
      errorText.innerText = "Nhập đủ Email/Mật khẩu!";
      return;
    }
    signInWithEmailAndPassword(auth, e, p).catch(() => {
      errorText.style.display = "block";
      errorText.innerText = "Sai Email/Mật khẩu!";
    });
  });

  // ==========================================================
  // CLICK ĐIỀU HƯỚNG CÁC TRANG CON
  // ==========================================================
  document.querySelectorAll(".btn-back-family").forEach((btn) => {
    btn.addEventListener("click", () => showView(familyIndex));
  });

  // 1. Click Hộ Gia Đình
  document.querySelectorAll("#family-index .feature-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector("h3").innerText;
      if (title === "Sổ thu chi gia đình") {
        showView(familyFinanceView);
        loadTransactions();
      } else if (title === "Thống kê chi tiêu") {
        showView(familyStatsView);
        loadStats();
      } else if (title === "Thành viên") {
        showView(familyMembersView);
        loadMembers();
      }
    });
  });

  // 2. Click Menu Xóm Trọ -> Hiện Fake View
  document.querySelectorAll(".motel-menu li").forEach((li) => {
    li.addEventListener("click", () => {
      const title = li.innerText.trim();
      if (title.includes("Bảng điều khiển")) return;
      fakeMotelView.querySelector("h2").innerHTML =
        `<i class="fas fa-check-circle"></i> ${title}`;
      showView(fakeMotelView);
    });
  });
  document
    .getElementById("btn-back-fake-motel")
    ?.addEventListener("click", () => showView(motelIndex));

  // 3. Click Menu Chung Cư -> Hiện Fake View
  document.querySelectorAll(".apt-menu li").forEach((li) => {
    li.addEventListener("click", () => {
      const title = li.innerText.trim();
      if (title.includes("Bảng điều khiển")) return;
      fakeApartmentView.querySelector("h2").innerHTML =
        `<i class="fas fa-check-circle"></i> ${title}`;
      showView(fakeApartmentView);
    });
  });
  document
    .getElementById("btn-back-fake-apt")
    ?.addEventListener("click", () => showView(apartmentIndex));

  // ==========================================================
  // LOGIC FIREBASE HỘ GIA ĐÌNH
  // ==========================================================
  const btnAddTrans = document.getElementById("btn-add-trans");
  if (btnAddTrans) {
    btnAddTrans.addEventListener("click", async () => {
      const desc = document.getElementById("trans-desc").value;
      const amount = document.getElementById("trans-amount").value;
      const type = document.getElementById("trans-type").value;
      const uid = auth.currentUser.uid;
      if (!desc || !amount) return alert("Vui lòng nhập đủ mô tả và số tiền!");
      btnAddTrans.innerText = "Đang lưu...";
      try {
        await addDoc(collection(db, "spaces", uid, "transactions"), {
          description: desc,
          amount: Number(amount),
          type: type,
          createdAt: new Date().toISOString(),
        });
        document.getElementById("trans-desc").value = "";
        document.getElementById("trans-amount").value = "";
        btnAddTrans.innerText = "Lưu";
        loadTransactions();
      } catch (error) {
        alert("Lỗi khi lưu: " + error.message);
        btnAddTrans.innerText = "Lưu";
      }
    });
  }

  async function loadTransactions() {
    const transList = document.getElementById("trans-list");
    if (!transList) return;
    transList.innerHTML =
      '<li style="text-align: center; color: gray;">Đang tải...</li>';
    const uid = auth.currentUser.uid;
    try {
      const q = query(
        collection(db, "spaces", uid, "transactions"),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty)
        return (transList.innerHTML =
          '<li style="text-align: center; color: gray; padding: 20px;">Chưa có giao dịch nào.</li>');
      transList.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const isIncome = data.type === "income";
        const li = document.createElement("li");
        li.style.cssText =
          "display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e2e8f0;";
        li.innerHTML = `<div><strong style="color: #1e293b; display: block;">${data.description}</strong><span style="font-size: 0.8rem; color: #64748b;">${new Date(data.createdAt).toLocaleDateString("vi-VN")}</span></div><strong style="color: ${isIncome ? "#10b981" : "#ef4444"}; font-size: 1.1rem;">${isIncome ? "+" : "-"} ${data.amount.toLocaleString("vi-VN")} đ</strong>`;
        transList.appendChild(li);
      });
    } catch (error) {
      transList.innerHTML = `<li style="color: red; text-align: center;">Lỗi tải: ${error.message}</li>`;
    }
  }

  async function loadStats() {
    const statInc = document.getElementById("stat-total-income");
    const statExp = document.getElementById("stat-total-expense");
    const statBal = document.getElementById("stat-balance");
    if (!statInc) return;
    statInc.innerText = "Đang tải...";
    statExp.innerText = "Đang tải...";
    statBal.innerText = "Đang tải...";
    try {
      const snapshot = await getDocs(
        collection(db, "spaces", auth.currentUser.uid, "transactions"),
      );
      let totalInc = 0;
      let totalExp = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.type === "income") totalInc += data.amount;
        else totalExp += data.amount;
      });
      statInc.innerText = "+ " + totalInc.toLocaleString("vi-VN") + " đ";
      statExp.innerText = "- " + totalExp.toLocaleString("vi-VN") + " đ";
      statBal.innerText = (totalInc - totalExp).toLocaleString("vi-VN") + " đ";
    } catch (error) {
      console.error("Lỗi thống kê:", error);
    }
  }

  const btnAddMember = document.getElementById("btn-add-member");
  if (btnAddMember) {
    btnAddMember.addEventListener("click", async () => {
      const name = document.getElementById("new-member-name").value;
      if (!name) return alert("Nhập tên thành viên!");
      btnAddMember.innerText = "...";
      try {
        await addDoc(
          collection(db, "spaces", auth.currentUser.uid, "members"),
          { name: name, addedAt: new Date().toISOString() },
        );
        document.getElementById("new-member-name").value = "";
        btnAddMember.innerText = "Thêm người";
        loadMembers();
      } catch (error) {
        alert("Lỗi khi thêm: " + error.message);
        btnAddMember.innerText = "Thêm người";
      }
    });
  }

  async function loadMembers() {
    const memList = document.getElementById("members-list");
    if (!memList) return;
    memList.innerHTML =
      '<li style="text-align: center; color: gray;">Đang tải...</li>';
    try {
      const snapshot = await getDocs(
        query(
          collection(db, "spaces", auth.currentUser.uid, "members"),
          orderBy("addedAt", "desc"),
        ),
      );
      if (snapshot.empty)
        return (memList.innerHTML =
          '<li style="text-align: center; color: gray; padding: 20px;">Chưa có thành viên nào. Hãy thêm!</li>');
      memList.innerHTML = "";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.style.cssText =
          "display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e2e8f0; align-items: center;";
        li.innerHTML = `<strong style="color: #1e293b; font-size: 1.1rem;"><i class="fas fa-user-circle" style="color: #94a3b8; margin-right: 10px;"></i>${data.name}</strong><span style="font-size: 0.8rem; color: #64748b;">Thêm ngày: ${new Date(data.addedAt).toLocaleDateString("vi-VN")}</span>`;
        memList.appendChild(li);
      });
    } catch (error) {
      memList.innerHTML = `<li style="color: red; text-align: center;">Lỗi tải: ${error.message}</li>`;
    }
  }
});
