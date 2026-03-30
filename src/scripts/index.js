import {
  createCardElement,
  deleteCard,
  likeCard,
  updateLikeCount,
  isCardLiked,
} from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setUserAvatar,
  addCard,
  deleteCardFromServer,
  changeLikeCardStatus,
} from "./components/api.js";

// Настройки валидации
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// DOM узлы
const placesWrap = document.querySelector(".places__list");

const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description"
);

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardModalWindow = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardModalWindow.querySelector(".popup__form");

// Попап статистики
const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalTitle = usersStatsModalWindow.querySelector(".popup__title");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info");
const usersStatsModalText = usersStatsModalWindow.querySelector(".popup__text");
const usersStatsModalUsersList = usersStatsModalWindow.querySelector(".popup__list");

const logoButton = document.querySelector(".header__logo");

// ID текущего пользователя (заполняется после загрузки данных)
let currentUserId = null;

// Данные карточки для удаления
let cardToDelete = null;
let cardElementToDelete = null;

// --- Вспомогательные функции ---

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const renderLoading = (buttonElement, isLoading, defaultText) => {
  if (isLoading) {
    buttonElement.textContent =
      defaultText === "Создать" ? "Создание..." : "Сохранение...";
  } else {
    buttonElement.textContent = defaultText;
  }
};

const renderRemoveLoading = (buttonElement, isLoading) => {
  buttonElement.textContent = isLoading ? "Удаление..." : "Да";
};

// --- Создание элементов для попапа статистики ---

const createInfoString = (term, description) => {
  const template = document
    .getElementById("popup-info-definition-template")
    .content.querySelector(".popup__info-item")
    .cloneNode(true);
  template.querySelector(".popup__info-term").textContent = term;
  template.querySelector(".popup__info-description").textContent = description;
  return template;
};

const createUserBadge = (name) => {
  const template = document
    .getElementById("popup-info-user-preview-template")
    .content.querySelector(".popup__list-item")
    .cloneNode(true);
  template.textContent = name;
  return template;
};

// --- Обработчики ---

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeCard = (likeButton, cardElement, cardId) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeCard(likeButton);
      updateLikeCount(cardElement, updatedCard.likes.length);
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleDeleteCard = (cardElement, cardId) => {
  cardToDelete = cardId;
  cardElementToDelete = cardElement;
  openModalWindow(removeCardModalWindow);
};

const handleRemoveCardSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = removeCardForm.querySelector(".popup__button");
  renderRemoveLoading(submitButton, true);

  deleteCardFromServer(cardToDelete)
    .then(() => {
      deleteCard(cardElementToDelete);
      closeModalWindow(removeCardModalWindow);
      cardToDelete = null;
      cardElementToDelete = null;
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderRemoveLoading(submitButton, false);
    });
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Сохранить");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Сохранить");
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Сохранить");

  setUserAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
      avatarForm.reset();
      clearValidation(avatarForm, validationSettings);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Сохранить");
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  renderLoading(submitButton, true, "Создать");

  addCard({ name: cardNameInput.value, link: cardLinkInput.value })
    .then((newCardData) => {
      placesWrap.prepend(
        createCardElement(newCardData, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeCard,
          onDeleteCard: handleDeleteCard,
        })
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
      clearValidation(cardForm, validationSettings);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false, "Создать");
    });
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      // Очищаем предыдущие данные
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUsersList.innerHTML = "";

      usersStatsModalTitle.textContent = "Статистика пользователей";
      usersStatsModalText.textContent = "Все пользователи:";

      // Всего карточек
      usersStatsModalInfoList.append(
        createInfoString("Всего карточек:", cards.length)
      );

      // Первая и последняя созданная
      if (cards.length > 0) {
        usersStatsModalInfoList.append(
          createInfoString(
            "Первая создана:",
            formatDate(new Date(cards[cards.length - 1].createdAt))
          )
        );
        usersStatsModalInfoList.append(
          createInfoString(
            "Последняя создана:",
            formatDate(new Date(cards[0].createdAt))
          )
        );
      }

      // Собираем уникальных пользователей
      const usersMap = new Map();
      cards.forEach((card) => {
        const ownerId = card.owner._id;
        if (!usersMap.has(ownerId)) {
          usersMap.set(ownerId, { name: card.owner.name, count: 0 });
        }
        usersMap.get(ownerId).count += 1;
      });

      // Всего пользователей
      usersStatsModalInfoList.append(
        createInfoString("Всего пользователей:", usersMap.size)
      );

      // Максимум карточек от одного
      let maxCards = 0;
      usersMap.forEach((userData) => {
        if (userData.count > maxCards) {
          maxCards = userData.count;
        }
      });
      usersStatsModalInfoList.append(
        createInfoString("Максимум карточек от одного:", maxCards)
      );

      // Список пользователей (бейджи)
      usersMap.forEach((userData) => {
        usersStatsModalUsersList.append(createUserBadge(userData.name));
      });

      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// --- Слушатели событий ---

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardSubmit);
logoButton.addEventListener("click", handleLogoClick);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

// --- Загрузка данных с сервера ---

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;

    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, currentUserId, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeCard,
          onDeleteCard: handleDeleteCard,
        })
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Включение валидации
enableValidation(validationSettings);
