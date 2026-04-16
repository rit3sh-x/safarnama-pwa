import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu, Route as RouteIcon } from "lucide-react";
import { MapView } from "../components/map-view";
import { UnifiedSidebar, SIDEBAR_WIDTH } from "../components/unified-sidebar";
import { PlaceInspector } from "../components/place-inspector";
import { PlanHeader } from "../components/plan-header";
import { PinButton } from "../components/pin-button";
import { RoutePlannerCredenza } from "../components/route-planner-credenza";
import { RouteChips } from "../components/route-chips";
import {
    PlaceFormDialog,
    type PlaceFormOutput,
} from "../components/place-form-dialog";
import { usePlanState } from "../../hooks/use-plan-state";
import { useLocation } from "../../hooks/use-location";
import {
    loadAllPaths,
    removePath,
    type PathEntry,
} from "../../hooks/use-route-planner";
import { useSettings } from "@/modules/settings/hooks/use-settings";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTripDetails } from "@/modules/trips/hooks/use-trips";
import {
    useAddPlaceToDay,
    useDays,
    useRemovePlaceFromDay,
    useUpdateDay,
    useUpdateDayNote,
    useUpsertDay,
} from "../../hooks/use-days";
import {
    useAddPlaceWithPhoto,
    usePlaces,
    useRemovePlace,
    useReorderPlaces,
    useUpdatePlace,
} from "../../hooks/use-places";
import { Button } from "@/components/ui/button";
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

    const s = usePlanState();

    const { coords: userCoords, error: locationError } = useLocation();
    const userLocation = useMemo(
        () =>
            userCoords
                ? { lat: userCoords.latitude, lng: userCoords.longitude }
                : null,
        [userCoords]
    );

    useEffect(() => {
        if (locationError?.code === 1) return;
        if (locationError?.code === 2) {
            console.warn(
                "[PlanView] Location unavailable:",
                locationError.message
            );
        } else if (locationError?.code === 3) {
            console.warn("[PlanView] Location request timed out");
        }
    }, [locationError]);

    const [plottedPaths, setPlottedPaths] = useState<PathEntry[]>(() =>
        loadAllPaths(tripId)
    );

    useEffect(() => {
        setPlottedPaths(loadAllPaths(tripId));
    }, [tripId]);

    const handlePathAdded = useCallback(() => {
        setPlottedPaths(loadAllPaths(tripId));
    }, [tripId]);

    const handlePathRemoved = useCallback(
        (pathId: string) => {
            removePath(tripId, pathId);
            setPlottedPaths(loadAllPaths(tripId));
        },
        [tripId]
    );

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
        if (!s.selectedDayId) return [];
        return (placesByDay[s.selectedDayId] ?? []).filter(
            (p) => p.lat && p.lng
        );
    }, [s.selectedDayId, placesByDay]);

    const dayOrderMap = useMemo(() => {
        if (!s.selectedDayId) return {};
        const dayP = placesByDay[s.selectedDayId] ?? [];
        const map: Record<string, number[]> = {};
        dayP.forEach((p, i) => {
            if (!map[p._id]) map[p._id] = [];
            map[p._id].push(i + 1);
        });
        return map;
    }, [s.selectedDayId, placesByDay]);

    const selectedPlace = s.selectedPlaceId
        ? (places.find((p) => p._id === s.selectedPlaceId) ?? null)
        : null;

    const selectedDay = s.selectedDayId
        ? (days.find((d) => d._id === s.selectedDayId) ?? null)
        : null;

    const handleMapClick = useCallback(
        (e: { lng: number; lat: number }) => {
            if (s.pinMode) {
                s.openPlaceForm({
                    prefill: { lat: e.lat, lng: e.lng },
                });
                s.setPinMode(false);
                return;
            }
            s.setSelectedPlaceId(null);
        },
        [s]
    );

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
            if (s.selectedPlaceId === placeId) s.setSelectedPlaceId(null);
        },
        [removePlace, s]
    );

    const handleSavePlace = useCallback(
        (data: PlaceFormOutput) => {
            if (s.editingPlace) {
                updatePlace({
                    placeId: s.editingPlace._id,
                    ...data,
                });
            } else {
                addPlace({
                    tripId,
                    dayId: s.selectedDayId ?? undefined,
                    name: data.name,
                    description: data.description,
                    address: data.address,
                    lat: data.lat,
                    lng: data.lng,
                    osmId: data.osmId,
                });
            }
            s.closePlaceForm();
        },
        [s, tripId, addPlace, updatePlace]
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

    const sidebarOffset = isMobile
        ? 0
        : s.sidebarCollapsed
          ? 44 + 16
          : SIDEBAR_WIDTH + 26;

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <PlanHeader trip={typedTrip} tripId={tripId} />
            <div className="relative min-h-0 flex-1">
                <div
                    className={cn(
                        "absolute inset-0 z-0",
                        s.pinMode &&
                            "[&_.leaflet-container]:cursor-crosshair! [&_.leaflet-grab]:cursor-crosshair!"
                    )}
                >
                    <MapView
                        places={mapPlaces}
                        dayPlaces={dayPlaces}
                        routes={plottedPaths}
                        userLocation={userLocation}
                        selectedPlaceId={s.selectedPlaceId}
                        onMarkerClick={s.handleMarkerClick}
                        onMapClick={handleMapClick}
                        center={[2.3522, 48.8566]}
                        zoom={defaultZoom}
                        fitKey={s.fitKey}
                        dayOrderMap={dayOrderMap}
                        leftWidth={sidebarOffset}
                        rightWidth={0}
                        hasInspector={!!selectedPlace}
                    />
                </div>

                <RouteChips
                    routes={plottedPaths}
                    places={places}
                    onRemove={handlePathRemoved}
                    leftOffset={sidebarOffset === 0 ? 16 : sidebarOffset}
                />

                <UnifiedSidebar
                    trip={typedTrip}
                    days={days}
                    places={places}
                    placesByDay={placesByDay}
                    selectedDayId={s.selectedDayId}
                    selectedPlaceId={s.selectedPlaceId}
                    isMobile={isMobile}
                    collapsed={s.sidebarCollapsed}
                    mobileOpen={s.mobileSheetOpen}
                    onCollapsedChange={s.setSidebarCollapsed}
                    onMobileOpenChange={s.setMobileSheetOpen}
                    onSelectDay={s.handleSelectDay}
                    onSelectPlace={s.handleSelectPlace}
                    onAddPlace={() => s.openPlaceForm()}
                    onDeletePlace={handleDeletePlace}
                    onRemoveFromDay={handleRemoveFromDay}
                    onReorderPlaces={handleReorderPlaces}
                    onUpdateDayTitle={handleUpdateDayTitle}
                    onUpdateDayNote={handleUpdateDayNote}
                    onEnsureDay={handleEnsureDay}
                />

                {isMobile && !s.mobileSheetOpen && (
                    <div className="absolute top-3 left-3 z-30 md:hidden">
                        <Button
                            variant="secondary"
                            className="gap-1.5 shadow-lg"
                            onClick={() => s.setMobileSheetOpen(true)}
                        >
                            <Menu className="size-4" />
                            Plan
                        </Button>
                    </div>
                )}

                <div
                    className="pointer-events-none absolute bottom-6 z-30 transition-all duration-300"
                    style={{
                        left: sidebarOffset === 0 ? 16 : sidebarOffset,
                    }}
                >
                    <Button
                        variant={s.showRoutePlanner ? "secondary" : "default"}
                        size="icon"
                        aria-label="Plan a route"
                        className={cn(
                            "pointer-events-auto size-11 rounded-full shadow-lg transition-all",
                            s.showRoutePlanner &&
                                "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                        )}
                        onClick={() =>
                            s.setShowRoutePlanner(!s.showRoutePlanner)
                        }
                    >
                        <RouteIcon className="size-5" />
                    </Button>
                </div>

                <div className="pointer-events-none absolute right-4 bottom-6 z-30">
                    <PinButton
                        active={s.pinMode}
                        onClick={() => s.setPinMode(!s.pinMode)}
                    />
                </div>

                {selectedPlace && (
                    <PlaceInspector
                        place={selectedPlace}
                        day={selectedDay}
                        isAssignedToDay={
                            !!s.selectedDayId &&
                            (placesByDay[s.selectedDayId] ?? []).some(
                                (p) => p._id === selectedPlace._id
                            )
                        }
                        onClose={() => s.setSelectedPlaceId(null)}
                        onEdit={() => s.openPlaceForm({ place: selectedPlace })}
                        onDelete={() => handleDeletePlace(selectedPlace._id)}
                        onAssignToDay={
                            s.selectedDayId
                                ? (placeId) =>
                                      handleAssignToDay(
                                          placeId,
                                          s.selectedDayId!
                                      )
                                : undefined
                        }
                        onRemoveFromDay={handleRemoveFromDay}
                        onUpdatePlace={(placeId, data) =>
                            updatePlace({ placeId, ...data })
                        }
                    />
                )}

                <PlaceFormDialog
                    open={s.showPlaceForm}
                    onOpenChange={(open) => {
                        s.setShowPlaceForm(open);
                        if (!open) s.closePlaceForm();
                    }}
                    onSave={handleSavePlace}
                    place={s.editingPlace}
                    prefillCoords={s.prefillCoords}
                    isSaving={isAddingPlace}
                />

                <RoutePlannerCredenza
                    open={s.showRoutePlanner}
                    onOpenChange={s.setShowRoutePlanner}
                    tripId={tripId}
                    places={places}
                    onPathAdded={handlePathAdded}
                    onPathRemoved={handlePathRemoved}
                />
            </div>
        </div>
    );
}
