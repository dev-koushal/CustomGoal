document.addEventListener("DOMContentLoaded", () => {
  let state = {
    questions: [],
    isShowingAll: false,
    sortAscending: true,
    leetcodeUsername: "",
  };

  const DOMElements = {
    usernameInput: document.getElementById("leetcode-username"),
    fetchBtn: document.getElementById("fetch-btn"),
    statsLoader: document.getElementById("stats-loader"),
    statsDisplay: document.getElementById("stats-display"),
    statsError: document.getElementById("stats-error"),
    profileName: document.getElementById("profile-name"),
    acceptanceRate: document.getElementById("acceptance-rate"),
    totalSolved: document.getElementById("total-solved"),
    easySolved: document.getElementById("easy-solved"),
    mediumSolved: document.getElementById("medium-solved"),
    hardSolved: document.getElementById("hard-solved"),
    easyProgress: document.getElementById("easy-progress"),
    mediumProgress: document.getElementById("medium-progress"),
    hardProgress: document.getElementById("hard-progress"),
    currentDateEl: document.getElementById("current-date"),
    questionList: document.getElementById("question-list"),
    emptyState: document.getElementById("empty-state"),
    settingsBtn: document.getElementById("settings-btn"),
    settingsMenu: document.getElementById("settings-menu"),
    viewToggleBtn: document.getElementById("view-toggle-btn"),
    sortBtn: document.getElementById("sort-by-date-btn"),
    sortIcon: document.getElementById("sort-icon"),
    clearByDateBtn: document.getElementById("clear-by-date-btn"),
    clearAllBtn: document.getElementById("clear-all-btn"),

    addModal: {
      backdrop: document.getElementById("add-modal"),
      form: document.getElementById("add-question-form"),
      title: document.getElementById("question-title"),
      link: document.getElementById("question-link"),
      date: document.getElementById("reminder-date"),
    },

    confirmModal: {
      backdrop: document.getElementById("confirm-modal"),
      title: document.getElementById("confirm-title"),
      message: document.getElementById("confirm-message"),
      extraInput: document.getElementById("confirm-extra-input"),
      dateInput: document.getElementById("clear-date-input"),
      confirmBtn: document.getElementById("confirm-action-btn"),
    },
  };

  const API = {
    leetCode: (username) =>
      `https://leetcode-stats-api.herokuapp.com/${username}`,
    saveToLocalStorage: () =>
      localStorage.setItem("revisionDashboardState", JSON.stringify(state)),
    loadFromLocalStorage: () => {
      const storedState = localStorage.getItem("revisionDashboardState");
      if (storedState) Object.assign(state, JSON.parse(storedState));
    },
  };

  const Utils = {
    getTodayString: () => new Date().toISOString().split("T")[0],
    formatDate: (dateString) =>
      new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    animateCount: (element, target) => {
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 100));
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          element.textContent = target;
          clearInterval(interval);
        } else {
          element.textContent = current;
        }
      }, 15);
    },
    toggleModal: (modal, show) => {
      modal.classList.toggle("hidden", !show);
    },
  };

  const Render = {
    leetCodeStats: (data) => {
      DOMElements.statsLoader.classList.add("hidden");
      DOMElements.statsError.classList.add("hidden");
      DOMElements.statsDisplay.classList.remove("hidden");

      DOMElements.profileName.textContent = data.username;
      DOMElements.acceptanceRate.textContent = `${data.acceptanceRate}%`;

      Utils.animateCount(DOMElements.totalSolved, data.totalSolved);
      Utils.animateCount(DOMElements.easySolved, data.easySolved);
      Utils.animateCount(DOMElements.mediumSolved, data.mediumSolved);
      Utils.animateCount(DOMElements.hardSolved, data.hardSolved);

      const total = data.totalQuestions;
      DOMElements.easyProgress.style.width = `${
        (data.easySolved / total) * 100
      }%`;
      DOMElements.mediumProgress.style.width = `${
        (data.mediumSolved / total) * 100
      }%`;
      DOMElements.hardProgress.style.width = `${
        (data.hardSolved / total) * 100
      }%`;
    },

    leetCodeError: (message) => {
      DOMElements.statsLoader.classList.add("hidden");
      DOMElements.statsDisplay.classList.add("hidden");
      DOMElements.statsError.textContent = message;
      DOMElements.statsError.classList.remove("hidden");
    },

    revisionList: () => {
      let questionsToDisplay = state.isShowingAll
        ? [...state.questions]
        : state.questions.filter(
            (q) => q.reminderDate === Utils.getTodayString()
          );

      if (state.isShowingAll) {
        questionsToDisplay.sort((a, b) => {
          const dateA = new Date(a.reminderDate);
          const dateB = new Date(b.reminderDate);
          return state.sortAscending ? dateA - dateB : dateB - dateA;
        });
      }

      DOMElements.questionList.innerHTML = "";
      DOMElements.emptyState.style.display =
        questionsToDisplay.length === 0 ? "flex" : "none";

      questionsToDisplay.forEach((q, index) => {
        const li = document.createElement("li");
        li.className = `list-item ${q.status}`;
        li.style.animationDelay = `${index * 0.05}s`;
        li.innerHTML = `
          <div class="info">
            <p class="title">${q.title}</p>
            ${
              state.isShowingAll
                ? `<p class="date">${Utils.formatDate(q.reminderDate)}</p>`
                : ""
            }
          </div>
          <div class="actions">
            <button class="toggle-btn ${q.status}" data-id="${q.id}" title="Toggle Status">
              <i class="fa-solid ${
                q.status === "done" ? "fa-circle-check" : "fa-circle-xmark"
              }"></i>
            </button>
            <a href="${q.link}" target="_blank" title="View Problem">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>`;
        DOMElements.questionList.appendChild(li);
      });
    },
  };

  const Handlers = {
    fetchLeetCodeData: async () => {
      const username = DOMElements.usernameInput.value.trim();
      if (!username) return;
      state.leetcodeUsername = username;
      API.saveToLocalStorage();

      DOMElements.statsDisplay.classList.add("hidden");
      DOMElements.statsError.classList.add("hidden");
      DOMElements.statsLoader.classList.remove("hidden");

      try {
        const response = await fetch(API.leetCode(username));
        const data = await response.json();
        if (data.errors) throw new Error(data.errors[0].message);
        Render.leetCodeStats(data);
      } catch (error) {
        Render.leetCodeError(
          `Error: ${error.message}. Please check the username.`
        );
      }
    },

    toggleQuestionStatus: (id) => {
      const question = state.questions.find((q) => q.id === id);
      if (question) {
        question.status = question.status === "done" ? "pending" : "done";
        API.saveToLocalStorage();
        Render.revisionList();
      }
    },

    addQuestion: (e) => {
      e.preventDefault();
      state.questions.push({
        id: Date.now(),
        title: DOMElements.addModal.title.value.trim(),
        link: DOMElements.addModal.link.value.trim(),
        reminderDate: DOMElements.addModal.date.value,
        status: "pending",
      });
      API.saveToLocalStorage();
      Render.revisionList();
      Utils.toggleModal(DOMElements.addModal.backdrop, false);
    },

    showConfirmation: (title, message, onConfirm, showDateInput = false) => {
      DOMElements.confirmModal.title.textContent = title;
      DOMElements.confirmModal.message.textContent = message;
      DOMElements.confirmModal.dateInput.value = Utils.getTodayString();
      DOMElements.confirmModal.extraInput.style.display = showDateInput
        ? "block"
        : "none";

      Utils.toggleModal(DOMElements.confirmModal.backdrop, true);

      DOMElements.confirmModal.confirmBtn.onclick = () => {
        onConfirm();
        Utils.toggleModal(DOMElements.confirmModal.backdrop, false);
      };
    },

    clearByDate: () => {
      const dateToClear = DOMElements.confirmModal.dateInput.value;
      if (!dateToClear) return;
      state.questions = state.questions.filter(
        (q) => q.reminderDate !== dateToClear
      );
      API.saveToLocalStorage();
      Render.revisionList();
    },

    clearAll: () => {
      state.questions = [];
      API.saveToLocalStorage();
      Render.revisionList();
    },
  };

  const init = () => {
    API.loadFromLocalStorage();

    DOMElements.currentDateEl.textContent = Utils.formatDate(
      Utils.getTodayString()
    );

    if (state.leetcodeUsername) {
      DOMElements.usernameInput.value = state.leetcodeUsername;
      Handlers.fetchLeetCodeData();
    }

    Render.revisionList();

    DOMElements.fetchBtn.addEventListener("click", Handlers.fetchLeetCodeData);
    DOMElements.usernameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") Handlers.fetchLeetCodeData();
    });

    document
      .getElementById("add-question-btn")
      .addEventListener("click", () => {
        DOMElements.addModal.form.reset();
        DOMElements.addModal.date.value = Utils.getTodayString();
        Utils.toggleModal(DOMElements.addModal.backdrop, true);
      });

    DOMElements.addModal.form.addEventListener("submit", Handlers.addQuestion);

    DOMElements.questionList.addEventListener("click", (e) => {
      const toggleBtn = e.target.closest(".toggle-btn");
      if (toggleBtn) {
        Handlers.toggleQuestionStatus(parseInt(toggleBtn.dataset.id));
      }
    });

    DOMElements.settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      DOMElements.settingsMenu.classList.toggle("visible");
    });

    document.addEventListener("click", () =>
      DOMElements.settingsMenu.classList.remove("visible")
    );

    DOMElements.viewToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      state.isShowingAll = !state.isShowingAll;
      e.target.textContent = state.isShowingAll ? "Show Today's" : "Show All";
      API.saveToLocalStorage();
      Render.revisionList();
    });

    DOMElements.sortBtn.addEventListener("click", (e) => {
      e.preventDefault();
      state.sortAscending = !state.sortAscending;
      DOMElements.sortIcon.className = `fa-solid ml-2 ${
        state.sortAscending ? "fa-arrow-down-long" : "fa-arrow-up-long"
      }`;
      API.saveToLocalStorage();
      if (state.isShowingAll) Render.revisionList();
    });

    DOMElements.clearByDateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      Handlers.showConfirmation(
        "Clear by Date",
        "Select a date to clear all revision goals. This action cannot be undone.",
        Handlers.clearByDate,
        true
      );
    });

    DOMElements.clearAllBtn.addEventListener("click", (e) => {
      e.preventDefault();
      Handlers.showConfirmation(
        "Clear All Data",
        "This will permanently delete all your revision goals. This action cannot be undone.",
        Handlers.clearAll
      );
    });

    document.querySelectorAll(".cancel-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        Utils.toggleModal(DOMElements.addModal.backdrop, false);
        Utils.toggleModal(DOMElements.confirmModal.backdrop, false);
      })
    );
  };

  init();
});

