/* STM32F103RC; official CMSIS/device startup environment required. */
#include "stm32f10x.h"
#include <stdint.h>

static volatile uint32_t ticks;

static int clock_hsi_8mhz(void)
{
    uint32_t guard = 1000000u;
    RCC->CR |= 1u;                       /* HSION */
    while (!(RCC->CR & 2u) && --guard) { }
    if (!guard) return 0;
    RCC->CFGR &= ~3u;                    /* SW = HSI */
    guard = 1000000u;
    while ((RCC->CFGR & 12u) && --guard) { }
    if (!guard) return 0;                /* wait for SWS = HSI */
    RCC->CFGR &= ~((15u << 4) | (7u << 8) | (7u << 11));
    RCC->CR &= ~(1u << 24);              /* PLL no longer the source */
    SystemCoreClock = 8000000u;
    return 1;
}

static void led_init(void)
{
    RCC->APB2ENR |= 1u << 2;             /* GPIOA clock */
    (void)RCC->APB2ENR;                  /* allow clock enable to propagate */
    GPIOA->BSRR = 1u << 8;               /* inactive high before output */
    GPIOA->CRH = (GPIOA->CRH & ~15u) | 2u; /* PA8: PP, 2MHz */
}

static void tick_init(void)
{
    RCC->APB1ENR |= 1u;                  /* TIM2 clock */
    (void)RCC->APB1ENR;
    TIM2->CR1 = 0;
    TIM2->DIER = 0;
    TIM2->PSC = 7;
    TIM2->ARR = 999;                     /* 8MHz / 8 / 1000 = 1kHz */
    TIM2->EGR = 1;                       /* UG loads the prescaler */
    TIM2->SR = 0;                        /* discard initialization UIF */
    TIM2->CNT = 0;
    ticks = 0;
    NVIC_SetPriorityGrouping(3);
    NVIC_SetPriority(TIM2_IRQn, 2);
    NVIC_ClearPendingIRQ(TIM2_IRQn);
    NVIC_EnableIRQ(TIM2_IRQn);
    TIM2->DIER = 1;                      /* UIE */
    TIM2->CR1 = 1;                       /* CEN */
}

void TIM2_IRQHandler(void)
{
    if (TIM2->SR & 1u) {
        TIM2->SR = (uint16_t)~1u;        /* write 0 to clear UIF only */
        ++ticks;
    }
}

int main(void)
{
    uint32_t since, now;
    unsigned on = 0;
    if (!clock_hsi_8mhz()) for (;;) { }  /* bounded startup failed */
    led_init();
    tick_init();
    since = ticks;
    for (;;) {
        now = ticks;
        if ((uint32_t)(now - since) >= 500u) {
            since = now;
            on ^= 1u;
            GPIOA->BSRR = on ? (1u << 24) : (1u << 8);
        }
    }
}
