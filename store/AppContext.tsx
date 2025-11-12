const duplicateComponents = useCallback(() => {
    if (state.selectedComponentIds.length === 0) return;

    const byId = new Map<string, WireframeComponent>(
      state.components.map(c => [c.id, c])
    );

    const toCopy = Array.from(allEffectivelySelectedIds)
      .map(id => byId.get(id as string))
      .filter((c): c is WireframeComponent => !!c);

    if (toCopy.some(c => c.isLocked)) {
      alert('Cannot duplicate locked components.');
      return;
    }

    const idMap = new Map<string, string>();
    toCopy.forEach(c => {
      idMap.set(
        c.id,
        Date.now().toString() + Math.random().toString(36).substring(2, 9)
      );
    });

    const newComponents = toCopy.map(c => ({
      ...c,
      id: idMap.get(c.id)!,
      x: c.x + 20,
      y: c.y + 20,
      label: `${c.label} (Copy)`,
      groupId: c.groupId ? idMap.get(c.groupId) : undefined,
      childIds: c.childIds?.map(childId => idMap.get(childId)!).filter(Boolean),
    }));

    const newTopSelected =
      state.selectedComponentIds
        .map(id => idMap.get(id)!)
        .filter(Boolean);

    dispatch({
      type: 'ADD_COMPONENTS',
      payload: newComponents,
    });
    dispatch({
      type: 'SET_SELECTED_COMPONENTS',
      payload: newTopSelected,
    });
  }, [
    state.components,
    state.selectedComponentIds,
    allEffectivelySelectedIds,
  ]);