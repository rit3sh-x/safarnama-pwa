import type { OnboardingScreen } from "../../types";

interface TextSlideProps {
    screen: OnboardingScreen;
    index: number;
}

export const TextSlide = ({ screen, index }: TextSlideProps) => {
    return (
        <div
            className="flex animate-slide-up flex-col gap-3 md:h-50"
            key={index}
        >
            <h1 className="text-4xl leading-tight font-extrabold tracking-tight md:text-5xl lg:text-6xl xl:text-7xl">
                {screen.headline}
            </h1>

            <p className="max-w-md text-base leading-relaxed font-normal md:text-lg lg:text-xl xl:text-2xl">
                {screen.subtext}
            </p>
        </div>
    );
};
