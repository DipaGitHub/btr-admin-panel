(function ($) {
  "use strict";
  let device_width = window.innerWidth;
  $.exists = function (selector) {
    return $(selector).length > 0;
  };

  gsap.registerPlugin(ScrollTrigger, SplitText);

  var vreJs = {
    m: function (e) {
      vreJs.d();
      vreJs.methods();
    },
    d: function (e) {
      (this._window = $(window)),
        (this._document = $(document)),
        (this._body = $("body")),
        (this._html = $("html"));
    },
    methods: function (e) {
      vreJs.mobileMenuActivation();
      vreJs.title_animation();
      vreJs.revelImageAnimation();
      vreJs.sectionSlideUp();
      vreJs.sectionSlideDown();
      vreJs.headerStickyMenu();
      vreJs.skew_up();
      vreJs.boxitem_slideup();
      vreJs.numberCounter();
      vreJs.videoPopup();
      vreJs.faq();
      vreJs.swiperActivation();
      vreJs.searchPopup();
      vreJs.wowAnimation();
      vreJs.projectFilter();
      vreJs.ProgressBar();
      vreJs.scrollToTop();
      vreJs.boxJumpSlideleft();
      vreJs.preloader();
    },

    // Start Top To Scroll
    scrollToTop: function () {
      $(document).ready(function () {
        let calcScrollValue = () => {
          let scrollProgress = document.getElementById("progress");
          let progressValue = document.getElementById("progress-value");
          let pos = document.documentElement.scrollTop;
          let calcHeight =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;
          let scrollValue = Math.round((pos * 100) / calcHeight);
          if (pos > 100) {
            scrollProgress.style.display = "grid";
          } else {
            scrollProgress.style.display = "none";
          }
          scrollProgress.addEventListener("click", () => {
            document.documentElement.scrollTop = 0;
          });
          scrollProgress.style.background = `conic-gradient(#CCFF00 ${scrollValue}%, #CCDEFF ${scrollValue}%)`;
        };

        window.onscroll = calcScrollValue;
        window.onload = calcScrollValue;
      });
      $('#progress').on('click', function (event) {
        event.preventDefault();
        jQuery('html, body').animate({
          scrollTop: 0
        }, 500);
        return false;
      });
    },
    // End Top To Scroll

    // Start Progress Bar
    ProgressBar: function () {
      $(document).ready(function () {
        var skillPers = document.querySelectorAll(".skill-per");

        skillPers.forEach(function (skillPer) {
          var datapercentage = parseFloat(
            skillPer.getAttribute("data-percentage")
          );
          skillPer.style.width = datapercentage + "%";

          var animatedValue = 0;
          var startTime = null;

          function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = timestamp - startTime;
            var stepPercentage = progress / 5000; // Dividing by duration in milliseconds (1000ms = 1s)

            if (stepPercentage < 1) {
              animatedValue = datapercentage * stepPercentage;
              skillPer.setAttribute(
                "data-percentage",
                Math.floor(animatedValue) + "%"
              );
              requestAnimationFrame(animate);
            } else {
              animatedValue = datapercentage;
              skillPer.setAttribute(
                "data-percentage",
                Math.floor(animatedValue) + "%"
              );
            }
          }

          requestAnimationFrame(animate);
        });
      });
    },
    // End Progress Bar

    // Start Project Filter
    projectFilter: function () {
      $(document).ready(function () {
        var $grid = $(".project-grid-active").isotope({
          // options
        });
        // filter items on button click
        $(".project-grid-btn").on("click", "li", function () {
          var filterValue = $(this).attr("data-filter");
          $grid.isotope({ filter: filterValue });
          $(this).siblings('.is-active').removeClass('is-active');
          $(this).addClass('is-active');
        });
      });
    },
    // End Project Filter

    // Start Wow Animation
    wowAnimation: function () {
      $(document).ready(function () {
        new WOW().init();
      });
    },
    // End Wow Animation

    // Start Search Popup
    searchPopup: function () {
      $(document).ready(function () {
        $(".header-search-bar").on("click", function () {
          $(".search-bar").addClass("active");
        });
        $(".search-popup-close").on("click", function () {
          $(".search-bar").removeClass("active");
        });
      });
    },
    // End Search Popup

    // Start Swiper Slider
    swiperActivation: function () {
      $(document).ready(function () {
        var swiper = new Swiper(".team-area-slider-home-2", {
          slidesPerView: 3,
          spaceBetween: 30,
          loop: true,
          breakpoints: {
            991: {
              slidesPerView: 3,
            },
            768: {
              slidesPerView: 2,
            },
            767: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            },
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
      });
      $(document).ready(function () {
        var swiper = new Swiper(".client-say-home-3", {
          slidesPerView: 1,
          loop: true,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
      });
    },
    // End Swiper Slider
    // Start Mobile Menu Activation
    mobileMenuActivation: function () {
      $(document).ready(function () {
        $(".menu-bar-btn").on("click", function () {
          $(".nft-mobile-menu").toggleClass("mobile-menu-active");
        });

        $(".nft-mobile-menu ul li.has-submenu a").each(function () {
          $(this).on("click", function () {
            $(this).siblings("ul").slideToggle();
          });
        });

        $(".close-menu").on("click", function () {
          $(".nft-mobile-menu").removeClass("mobile-menu-active");
        });
      });
    },
    // End Mobile Menu Activation

    // Start Faq
    faq: function () {
      $(document).ready(function () {
        document.querySelectorAll(".accordion-header").forEach((button) => {
          button.addEventListener("click", () => {
            const accordionContent = button.nextElementSibling;

            button.classList.toggle("active");

            if (button.classList.contains("active")) {
              accordionContent.style.maxHeight =
                accordionContent.scrollHeight + "px";
            } else {
              accordionContent.style.maxHeight = 0;
            }
            document
              .querySelectorAll(".accordion-header")
              .forEach((otherButton) => {
                if (otherButton !== button) {
                  otherButton.classList.remove("active");
                  otherButton.nextElementSibling.style.maxHeight = 0;
                }
              });
          });
        });
      });
    },
    // End Faq

    // Start Number Counter
    numberCounter: function () {
      $(document).ready(function () {
        (() => {
          const counter = document.querySelectorAll(".counter");
          const array = Array.from(counter);
          array.map((item) => {
            let counterInnerText = item.textContent;
            let count = 1;
            let speed = item.dataset.speed / counterInnerText;
            function counterUp() {
              item.textContent = count++;
              if (counterInnerText < count) {
                clearInterval(stop);
              }
            }
            const stop = setInterval(() => {
              counterUp();
            }, speed);
          });
        })();
      });
    },
    // End Number Counter

    // Start Video Popup
    videoPopup: function () {
      $(document).ready(function () {
        $(".popup-video").magnificPopup({
          type: "iframe",
        });
      });
      $(document).ready(function () {
        $(".popup-video-1").magnificPopup({
          type: "iframe",
        });
      });
    },
    // End Video Popup

    // Start Title ANimation 1
    title_animation: function () {
      gsap.registerPlugin(ScrollTrigger);
      gsap.registerPlugin(SplitText);
      if (window.innerWidth > 768) {
        $(document).ready(function () {
          let addAnimation = function () {
            $(".split-collab").each(function (index) {
              const textInstance = $(this);
              const text = new SplitText(textInstance, {
                type: "chars",
              });

              let letters = text.chars;

              let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: textInstance,
                  start: "top 85%",
                  end: "top 85%",
                  onComplete: function () {
                    textInstance.removeClass(".split-collab");
                  },
                },
              });

              tl.set(textInstance, { opacity: 1 }).from(letters, {
                duration: 0.5,
                autoAlpha: 0,
                x: 50,
                // scaleY: 0,
                // skewX: 50,
                stagger: { amount: 1 },
                ease: "back.out(1)",
              });
            });
          };

          addAnimation();

          window.addEventListener("resize", function (event) {
            if ($(window).width() >= 992) {
              addAnimation();
            }
          });
        });
      }
    },
    // End Title  Animation 1

    // End Title  Animation 2
    skew_up: function () {
      gsap.registerPlugin(SplitText);
      if (window.innerWidth > 768) {
        $(document).ready(function () {
          let addAnimation = function () {
            $(".skew-up").each(function (index) {
              const text = new SplitType($(this), {
                types: "lines, words",
                lineClass: "word-line",
              });
              let textInstance = $(this);
              let line = textInstance.find(".word-line");
              let word = line.find(".word");
              let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: textInstance,
                  start: "top 85%",
                  end: "top 85%",
                  onComplete: function () {
                    $(textInstance).removeClass("skew-up");
                  },
                },
              });
              tl.set(textInstance, { opacity: 1 }).from(word, {
                y: "100%",
                skewX: "-5",
                duration: 2,
                stagger: 0.09,
                ease: "expo.out",
              });
            });
          };
          addAnimation();
          window.addEventListener("resize", function (event) {
            if ($(window).width() >= 992) {
              addAnimation();
            }
          });
        });
      }

      if (window.innerWidth > 768) {
        $(document).ready(function () {
          let addAnimation = function () {
            $(".skew-up-2").each(function (index) {
              const textInstance = $(this);
              const text = new SplitText(textInstance, {
                type: "chars",
              });

              let letters = text.chars;

              let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: textInstance,
                  start: "top 85%",
                  end: "top 85%",
                  onComplete: function () {
                    textInstance.removeClass("skew-up-2");
                  },
                },
              });

              tl.set(textInstance, { opacity: 1 }).from(letters, {
                duration: 0.4,
                autoAlpha: 0,
                y: 50,
                // scaleX: 0,
                // skewX: 50,
                stagger: { amount: 1 },
                ease: "back.out(0)",
              });
            });
          };

          addAnimation();

          window.addEventListener("resize", function (event) {
            if ($(window).width() >= 992) {
              addAnimation();
            }
          });
        });
      }
    },
    // End Title  Animation 2

    // Start Image Reavel Animation
    revelImageAnimation: function () {
      $(document).ready(function () {
        gsap.registerPlugin(ScrollTrigger);
        let revealContainers = document.querySelectorAll(".vre-reveal-one");
        revealContainers.forEach((container) => {
          let image = container.querySelector(".vre-reveal-image-one");
          let vre = gsap.timeline({
            scrollTrigger: {
              trigger: container,
              toggleActions: "restart none none reset",
            },
          });

          vre.set(container, {
            autoAlpha: 1,
          });

          vre.from(container, {
            xPercent: 100,
            duration: 1.5,
            ease: "power2.out",
          });

          vre.from(image, {
            xPercent: -100,
            scale: 1.3,
            duration: 1.5,
            ease: "power2.out",
            delay: -1.5,
          });
        });

        ScrollTrigger.refresh();
      });
    },
    // End Image Reavel Animation

    // Start Area Slide up Animation
    sectionSlideUp: function () {
      $(document).ready(function () {
        $(".vre-slide-up-gsap").each(function () {
          let vre_SkewInUp = gsap.timeline({
            scrollTrigger: {
              trigger: this,
              start: "top bottom",
              markers: false,
            },
          });

          vre_SkewInUp.from(
            this,
            {
              duration: 2,
              skewY: 0,
              transformOrigin: "left top",
              autoAlpha: 0,
              y: 100,
              ease: Expo.easeOut,
              toggleActions: "restart pause resume reverse",
              clearProps: "all",
            },
            "+=0.2"
          );
        });
      });
    },
    // End Area Slide up Animation

    // Start Area Slide down Animation
    sectionSlideDown: function () {
      $(document).ready(function () {
        $(".vre-slide-down-gsap").each(function () {
          let vre_SkewInUp = gsap.timeline({
            scrollTrigger: {
              trigger: this,
              start: "top bottom",
              markers: false,
            },
          });

          vre_SkewInUp.from(
            this,
            {
              duration: 2,
              skewY: 0,
              transformOrigin: "right bottom",
              autoAlpha: 0,
              x: 100,
              ease: Expo.easeOut,
              toggleActions: "restart pause resume reverse",
              clearProps: "all",
            },
            "+=0.2"
          );
        });
      });
    },
    // End Area Slide down Animation

    // Start Box Item Animation
    boxitem_slideup: function () {
      $(document).ready(function () {
        TweenMax.to(".boxitembowns", 2, {
          y: 275,
          repeat: -1,
          repeatDelay: 0.5,
          ease: Bounce.easeOut,
        });
      });
    },
    // End Box Item Animation
    
    // Start Header Sticky Menu
    headerStickyMenu: function () {
      $(document).ready(function () {
        $(window).on("scroll", function () {
          var scrollBarPosition = $(this).scrollTop();
          if (scrollBarPosition > 80) {
            $(".header-sticky").addClass("sticky-on");
          } else {
            $(".header-sticky").removeClass("sticky-on");
          }
        });
      });
    },
    // End Header Sticky Menu

    // Start Box Jump Slideleft
    boxJumpSlideleft: function() {
      $(document).ready(function () {
        let st_box_jump_animation = document.getElementsByClassName('st_box_jump_animation');
        if (st_box_jump_animation.length) {
          gsap.set(".st_box_animation .st_box_anim", {
            y: -100,
            opacity: 0,
          })
          if (device_width < 1023) {
            const counterArray = gsap.utils.toArray(".st_box_animation .st_box_anim")
            counterArray.forEach((item, i) => {
              let counterTl = gsap.timeline({
                scrollTrigger: {
                  trigger: item,
                  start: "top center+=200",
                }
              })
              counterTl.to(item, {
                y: 0,
                opacity: 1,
                ease: "bounce",
                duration: 1,
              })
            })
          } else {
            gsap.to(".st_box_animation .st_box_anim", {
              scrollTrigger: {
                trigger: ".st_box_animation",
                start: "top center+=300",
              },
              y: 0,
              opacity: 1,
              ease: "bounce",
              duration: 1,
              stagger: {
                each: 0.3,
              }
            })
          }
        }
      });
    },
    // End Box Jump Slideleft  

    // Start Preloader
    preloader:function(){
      window.addEventListener('load',function(){
        document.querySelector('body').classList.add("loaded")  
      });          
    }
    // End Preloader 
  };
  vreJs.m();
})(jQuery, window);
