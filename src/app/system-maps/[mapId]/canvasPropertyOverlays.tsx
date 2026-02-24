"use client";

import {
  BowtiePropertiesAside,
  CategoryPropertiesAside,
  DocumentPropertiesAside,
  GroupingContainerAside,
  ImageAssetAside,
  PersonPropertiesAside,
  ProcessPropertiesAside,
  StickyNoteAside,
  SystemPropertiesAside,
  TextBoxAside,
} from "./canvasElementAsides";

type CanvasElementPropertyOverlaysProps = {
  categoryProps: Parameters<typeof CategoryPropertiesAside>[0];
  systemProps: Parameters<typeof SystemPropertiesAside>[0];
  processProps: Parameters<typeof ProcessPropertiesAside>[0];
  personProps: Parameters<typeof PersonPropertiesAside>[0];
  bowtieProps: Parameters<typeof BowtiePropertiesAside>[0];
  groupingProps: Parameters<typeof GroupingContainerAside>[0];
  stickyProps: Parameters<typeof StickyNoteAside>[0];
  imageProps: Parameters<typeof ImageAssetAside>[0];
  textBoxProps: Parameters<typeof TextBoxAside>[0];
  documentProps: Parameters<typeof DocumentPropertiesAside>[0];
};

export function CanvasElementPropertyOverlays({
  categoryProps,
  systemProps,
  processProps,
  personProps,
  bowtieProps,
  groupingProps,
  stickyProps,
  imageProps,
  textBoxProps,
  documentProps,
}: CanvasElementPropertyOverlaysProps) {
  return (
    <>
      <CategoryPropertiesAside {...categoryProps} />
      <SystemPropertiesAside {...systemProps} />
      <ProcessPropertiesAside {...processProps} />
      <PersonPropertiesAside {...personProps} />
      <BowtiePropertiesAside {...bowtieProps} />
      <GroupingContainerAside {...groupingProps} />
      <StickyNoteAside {...stickyProps} />
      <ImageAssetAside {...imageProps} />
      <TextBoxAside {...textBoxProps} />
      <DocumentPropertiesAside {...documentProps} />
    </>
  );
}
