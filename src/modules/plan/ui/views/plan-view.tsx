import { useState, useCallback, useMemo } from "react";
import {
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    MapIcon,
    ListIcon,
    X,
} from "lucide-react";
import { MapView } from "../components/map-view";
import { DayPlanSidebar } from "../components/day-plan-sidebar";
import { PlacesSidebar } from "../components/places-sidebar";
import { PlaceInspector } from "../components/place-inspector";
import { DayDetailPanel } from "../components/day-detail-panel";
import {
    PlaceFormDialog,
    type PlaceFormOutput,
} from "../components/place-form-dialog";
import { useSettings } from "@/modules/settings/hooks/use-settings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTripDetails } from "@/modules/trips/hooks/use-trips";
import { useDays, useUpdateDay, useUpsertDay, useUpdateDayNote } from "../../hooks/use-days";
import {
    usePlaces,
    useAddPlaceWithPhoto,
    useUpdatePlace,
    useRemovePlace,
    useReorderPlaces,
} from "../../hooks/use-places";
import { useAddPlaceToDay, useRemovePlaceFromDay } from "../../hooks/use-days";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "@backend/dataModel";

interface PlanViewProps {
    tripId: Id<"trip">;
}

export function PlanView({ tripId }: PlanViewProps) {
    const isMobile = useIsMobile();
    const { defaultZoom } = useSettings();
    const { trip, isLoading: isTripLoading } = useTripDetails(tripId);
    const { days, isLoading: isDaysLoading } = useDays(tripId);
    const { places, isLoading: isPlacesLoading } = usePlaces(tripId);

    const typedTrip = trip as Doc<"trip"> | undefined;

    const { mutate: addPlace, isPending: isAddingPlace } =
        useAddPlaceWithPhoto();
    const { mutate: updatePlace } = useUpdatePlace();
    const { mutate: removePlace } = useRemovePlace();
    const { mutate: reorderPlaces } = useReorderPlaces();
    const { mutate: addPlaceToDay } = useAddPlaceToDay();
    const { mutate: removePlaceFromDay } = useRemovePlaceFromDay();
    const { mutate: updateDay } = useUpdateDay();
    const { mutate: upsertDay } = useUpsertDay();
    const { mutate: updateDayNote } = useUpdateDayNote();

    const isLoading = isTripLoading || isDaysLoading || isPlacesLoading;

    const [selectedDayId, setSelectedDayId] = useState<Id<"day"> | null>(null);
    const [selectedPlaceId, setSelectedPlaceId] = useState<Id<"place"> | null>(
        null
    );
    const [showDayDetail, setShowDayDetail] = useState<Doc<"day"> | null>(null);
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [mobileSidebar, setMobileSidebar] = useState<"left" | "right" | null>(
        null
    );
    const [fitKey, setFitKey] = useState(0);
    const [showPlaceForm, setShowPlaceForm] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Doc<"place"> | null>(null);
    const [prefillCoords, setPrefillCoords] = useState<{
        lat: number;
        lng: number;
        name?: string;
        address?: string;
    } | null>(null);

    const placesByDay = useMemo(() => {
        const map: Record<string, Doc<"place">[]> = {};
        for (const d of days) map[d._id] = [];
        for (const p of places) {
            if (p.dayId && map[p.dayId]) map[p.dayId].push(p);
        }
        for (const key of Object.keys(map)) {
            map[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        return map;
    }, [days, places]);

    const mapPlaces = useMemo(
        () => places.filter((p) => p.lat && p.lng),
        [places]
    );

    const dayPlaces = useMemo(() => {
        if (!selectedDayId) return [];
        return (placesByDay[selectedDayId] ?? []).filter((p) => p.lat && p.lng);
    }, [selectedDayId, placesByDay]);

    const dayOrderMap = useMemo(() => {
        if (!selectedDayId) return {};
        const dayP = placesByDay[selectedDayId] ?? [];
        const map: Record<string, number[]> = {};
        dayP.forEach((p, i) => {
            if (!map[p._id]) map[p._id] = [];
            map[p._id].push(i + 1);
        });
        return map;
    }, [selectedDayId, placesByDay]);

    const selectedPlace = selectedPlaceId
        ? (places.find((p) => p._id === selectedPlaceId) ?? null)
        : null;

    const selectedDay = selectedDayId
        ? (days.find((d) => d._id === selectedDayId) ?? null)
        : null;

    const handleSelectDay = useCallback(
        (dayId: Id<"day">) => {
            const changed = dayId !== selectedDayId;
            setSelectedDayId(dayId);
            if (changed) setFitKey((k) => k + 1);
            setMobileSidebar(null);
        },
        [selectedDayId]
    );

    const handleSelectPlace = useCallback((placeId: Id<"place"> | null) => {
        setSelectedPlaceId(placeId);
        if (placeId) setShowDayDetail(null);
    }, []);

    const handleMarkerClick = useCallback((placeId: Id<"place">) => {
        setSelectedPlaceId((prev) => (prev === placeId ? null : placeId));
    }, []);

    const handleMapClick = useCallback(() => {
        setSelectedPlaceId(null);
    }, []);

    const handleEnsureDay = useCallback(
        async (dayNumber: number) => {
            const dayId = await upsertDay({ tripId, dayNumber });
            return dayId;
        },
        [tripId, upsertDay]
    );

    const handleReorderPlaces = useCallback(
        (dayId: Id<"day">, placeIds: Id<"place">[]) => {
            reorderPlaces({ dayId, placeIds });
        },
        [reorderPlaces]
    );

    const handleUpdateDayTitle = useCallback(
        (dayId: Id<"day">, title: string) => {
            updateDay({ dayId, title });
        },
        [updateDay]
    );

    const handleUpdateDayNote = useCallback(
        (dayId: Id<"day">, note: string) => {
            updateDayNote({ dayId, note });
        },
        [updateDayNote]
    );

    const handleAssignToDay = useCallback(
        (placeId: Id<"place">, dayId: Id<"day">) => {
            addPlaceToDay({ dayId, placeId });
        },
        [addPlaceToDay]
    );

    const handleRemoveFromDay = useCallback(
        (placeId: Id<"place">) => {
            removePlaceFromDay({ placeId });
        },
        [removePlaceFromDay]
    );

    const handleDeletePlace = useCallback(
        (placeId: Id<"place">) => {
            removePlace({ placeId });
            if (selectedPlaceId === placeId) setSelectedPlaceId(null);
        },
        [removePlace, selectedPlaceId]
    );

    const handleAddPlace = useCallback(() => {
        setEditingPlace(null);
        setPrefillCoords(null);
        setShowPlaceForm(true);
    }, []);

    const handleEditPlace = useCallback((place: Doc<"place">) => {
        setEditingPlace(place);
        setPrefillCoords(null);
        setShowPlaceForm(true);
    }, []);

    const handleSavePlace = useCallback(
        (data: PlaceFormOutput) => {
            if (editingPlace) {
                updatePlace({
                    placeId: editingPlace._id,
                    ...data,
                });
            } else {
                addPlace({
                    tripId,
                    dayId: selectedDayId ?? undefined,
                    name: data.name,
                    description: data.description,
                    address: data.address,
                    lat: data.lat,
                    lng: data.lng,
                    osmId: data.osmId,
                    placeTime: data.placeTime,
                    endTime: data.endTime,
                });
            }
            setShowPlaceForm(false);
            setEditingPlace(null);
        },
        [editingPlace, tripId, selectedDayId, addPlace, updatePlace]
    );

    const handleUpdatePlace = useCallback(
        (placeId: Id<"place">, data: Partial<Doc<"place">>) => {
            updatePlace({ placeId, ...data });
        },
        [updatePlace]
    );

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!typedTrip) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Trip not found</p>
            </div>
        );
    }

    const LEFT_WIDTH = 340;
    const RIGHT_WIDTH = 320;

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 z-0">
                <MapView
                    places={mapPlaces}
                    dayPlaces={dayPlaces}
                    selectedPlaceId={selectedPlaceId}
                    onMarkerClick={handleMarkerClick}
                    onMapClick={handleMapClick}
                    center={[48.8566, 2.3522]}
                    zoom={defaultZoom}
                    fitKey={fitKey}
                    dayOrderMap={dayOrderMap}
                    leftWidth={leftCollapsed ? 0 : LEFT_WIDTH}
                    rightWidth={rightCollapsed ? 0 : RIGHT_WIDTH}
                    hasInspector={!!selectedPlace}
                />
            </div>

            <div className="pointer-events-none absolute inset-y-2.5 left-2.5 z-20 hidden md:block">
                <Button
                    variant={leftCollapsed ? "default" : "secondary"}
                    size="icon"
                    className={cn(
                        "pointer-events-auto absolute top-3 z-10 size-9 rounded-lg",
                        leftCollapsed ? "left-0" : "-right-11"
                    )}
                    onClick={() => setLeftCollapsed((c) => !c)}
                >
                    {leftCollapsed ? (
                        <PanelLeftOpen className="size-4" />
                    ) : (
                        <PanelLeftClose className="size-4" />
                    )}
                </Button>

                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        leftCollapsed ? "w-0 opacity-0" : "opacity-100"
                    )}
                    style={{ width: leftCollapsed ? 0 : LEFT_WIDTH }}
                >
                    {!leftCollapsed && (
                        <DayPlanSidebar
                            trip={typedTrip}
                            days={days}
                            placesByDay={placesByDay}
                            selectedDayId={selectedDayId}
                            selectedPlaceId={selectedPlaceId}
                            onSelectDay={handleSelectDay}
                            onSelectPlace={(id) => handleSelectPlace(id)}
                            onRemovePlace={handleRemoveFromDay}
                            onReorderPlaces={handleReorderPlaces}
                            onMovePlaceToDay={handleAssignToDay}
                            onUpdateDayTitle={handleUpdateDayTitle}
                            onUpdateDayNote={handleUpdateDayNote}
                            onEnsureDay={handleEnsureDay}
                            className="h-full"
                        />
                    )}
                </div>
            </div>

            <div className="pointer-events-none absolute inset-y-2.5 right-2.5 z-20 hidden md:block">
                <Button
                    variant={rightCollapsed ? "default" : "secondary"}
                    size="icon"
                    className={cn(
                        "pointer-events-auto absolute top-3 z-10 size-9 rounded-lg",
                        rightCollapsed ? "right-0" : "-left-11"
                    )}
                    onClick={() => setRightCollapsed((c) => !c)}
                >
                    {rightCollapsed ? (
                        <PanelRightOpen className="size-4" />
                    ) : (
                        <PanelRightClose className="size-4" />
                    )}
                </Button>

                <div
                    className={cn(
                        "h-full transition-all duration-300",
                        rightCollapsed ? "w-0 opacity-0" : "opacity-100"
                    )}
                    style={{ width: rightCollapsed ? 0 : RIGHT_WIDTH }}
                >
                    {!rightCollapsed && (
                        <PlacesSidebar
                            places={places}
                            days={days}
                            selectedDayId={selectedDayId}
                            selectedPlaceId={selectedPlaceId}
                            onSelectPlace={handleSelectPlace}
                            onAddPlace={handleAddPlace}
                            onDeletePlace={handleDeletePlace}
                            onAssignToDay={handleAssignToDay}
                            className="h-full"
                        />
                    )}
                </div>
            </div>

            {isMobile && !mobileSidebar && (
                <div className="absolute inset-x-3 top-3 z-30 flex justify-between md:hidden">
                    <Button
                        variant="secondary"
                        className="gap-1.5 shadow-lg"
                        onClick={() => setMobileSidebar("left")}
                    >
                        <MapIcon className="size-4" />
                        Plan
                    </Button>
                    <Button
                        variant="secondary"
                        className="gap-1.5 shadow-lg"
                        onClick={() => setMobileSidebar("right")}
                    >
                        <ListIcon className="size-4" />
                        Places
                    </Button>
                </div>
            )}

            <Sheet
                open={mobileSidebar !== null}
                onOpenChange={(open) => !open && setMobileSidebar(null)}
            >
                <SheetContent
                    side="left"
                    className="w-full max-w-sm p-0 sm:max-w-md [&>button]:hidden"
                >
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <span className="text-sm font-semibold">
                                {mobileSidebar === "left"
                                    ? "Day Plan"
                                    : "Places"}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-full"
                                onClick={() => setMobileSidebar(null)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-hidden">
                            {mobileSidebar === "left" ? (
                                <DayPlanSidebar
                                    trip={typedTrip}
                                    days={days}
                                    placesByDay={placesByDay}
                                    selectedDayId={selectedDayId}
                                    selectedPlaceId={selectedPlaceId}
                                    onSelectDay={handleSelectDay}
                                    onSelectPlace={(id) => {
                                        handleSelectPlace(id);
                                        setMobileSidebar(null);
                                    }}
                                    onRemovePlace={handleRemoveFromDay}
                                    onReorderPlaces={handleReorderPlaces}
                                    onMovePlaceToDay={handleAssignToDay}
                                    onUpdateDayTitle={handleUpdateDayTitle}
                                    onUpdateDayNote={handleUpdateDayNote}
                                    onEnsureDay={handleEnsureDay}
                                    className="h-full rounded-none border-0 shadow-none"
                                />
                            ) : (
                                <PlacesSidebar
                                    places={places}
                                    days={days}
                                    selectedDayId={selectedDayId}
                                    selectedPlaceId={selectedPlaceId}
                                    isMobile
                                    onSelectPlace={(id) => {
                                        handleSelectPlace(id);
                                        setMobileSidebar(null);
                                    }}
                                    onAddPlace={handleAddPlace}
                                    onDeletePlace={handleDeletePlace}
                                    onAssignToDay={handleAssignToDay}
                                    className="h-full rounded-none border-0 shadow-none"
                                />
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {showDayDetail && !selectedPlace && (
                <DayDetailPanel
                    day={showDayDetail}
                    dayIndex={days.findIndex(
                        (d) => d._id === showDayDetail._id
                    )}
                    placeCount={(placesByDay[showDayDetail._id] ?? []).length}
                    lat={dayPlaces[0]?.lat}
                    lng={dayPlaces[0]?.lng}
                    onClose={() => setShowDayDetail(null)}
                />
            )}

            {selectedPlace && (
                <PlaceInspector
                    place={selectedPlace}
                    day={selectedDay}
                    isAssignedToDay={
                        !!selectedDayId &&
                        (placesByDay[selectedDayId] ?? []).some(
                            (p) => p._id === selectedPlace._id
                        )
                    }
                    onClose={() => setSelectedPlaceId(null)}
                    onEdit={() => handleEditPlace(selectedPlace)}
                    onDelete={() => handleDeletePlace(selectedPlace._id)}
                    onAssignToDay={
                        selectedDayId
                            ? (placeId) =>
                                  handleAssignToDay(placeId, selectedDayId)
                            : undefined
                    }
                    onRemoveFromDay={handleRemoveFromDay}
                    onUpdatePlace={handleUpdatePlace}
                />
            )}

            <PlaceFormDialog
                open={showPlaceForm}
                onOpenChange={(open) => {
                    setShowPlaceForm(open);
                    if (!open) {
                        setEditingPlace(null);
                        setPrefillCoords(null);
                    }
                }}
                onSave={handleSavePlace}
                place={editingPlace}
                prefillCoords={prefillCoords}
                isSaving={isAddingPlace}
            />
        </div>
    );
}
